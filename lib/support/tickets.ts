import { createSupabaseServerClient, createSupabaseAdminClient } from '../supabase/server';
import { sendAdminAlert } from '../admin/alerts';

type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high';
type SenderType = 'customer' | 'admin';

export interface CreateTicketParams {
    guestEmail: string;
    subject: string;
    initialMessage: string;
    orderId?: string | null;
    priority?: TicketPriority;
}

export async function createTicket(params: CreateTicketParams) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Create the ticket
    const { data: ticket, error: ticketErr } = await supabase
        .from('support_tickets')
        .insert({
            user_id: user?.id || null,
            guest_email: params.guestEmail,
            order_id: params.orderId || null,
            subject: params.subject,
            priority: params.priority || 'medium',
            status: 'open',
        })
        .select('id')
        .single();

    if (ticketErr || !ticket) {
        throw new Error(`Failed to create ticket: ${ticketErr?.message}`);
    }

    // 2. Add the initial message
    const { error: msgErr } = await supabase
        .from('ticket_messages')
        .insert({
            ticket_id: ticket.id,
            sender_type: 'customer',
            sender_email: params.guestEmail,
            content: params.initialMessage,
        });

    if (msgErr) {
        // If message fails, we should technically rollback or alert, but let's just log for now
        console.error('[createTicket] Failed to attach initial message:', msgErr);
    }

    // 3. Alert Admin asynchronously
    setTimeout(() => {
        sendAdminAlert({
            level: 'warning',
            title: '🎫 New Support Ticket',
            message: `From: ${params.guestEmail}\nSubject: ${params.subject}`,
            data: { ticketId: ticket.id, orderId: params.orderId },
        }).catch(console.error);
    }, 0);

    return ticket.id;
}

export async function addTicketMessage(ticketId: string, senderType: SenderType, content: string, senderEmail?: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    let emailToSave = senderEmail;

    // If no email provided, try to resolve from session or db
    if (!emailToSave) {
        if (senderType === 'admin') {
            emailToSave = user?.email || 'admin@gosimy.com';
        } else {
            // Fetch ticket to get guest_email
            const { data: t } = await supabase.from('support_tickets').select('guest_email').eq('id', ticketId).single();
            emailToSave = t?.guest_email || 'unknown@customer.com';
        }
    }

    const { data: message, error } = await supabase
        .from('ticket_messages')
        .insert({
            ticket_id: ticketId,
            sender_type: senderType,
            sender_email: emailToSave,
            content,
        })
        .select('id')
        .single();

    if (error || !message) {
        throw new Error(`Failed to add message: ${error?.message}`);
    }

    // If customer replies to a resolved/closed ticket, reopen it
    if (senderType === 'customer') {
        const adminClient = createSupabaseAdminClient();
        await adminClient
            .from('support_tickets')
            .update({ status: 'open', updated_at: new Date().toISOString() })
            .eq('id', ticketId)
            .in('status', ['resolved', 'closed']);

        // Alert Admin
        setTimeout(() => {
            sendAdminAlert({
                level: 'info',
                title: '💬 Ticket Reply Received',
                message: `Customer ${emailToSave} has replied to ticket ${ticketId.slice(0, 8)}`,
            }).catch(console.error);
        }, 0);
    }

    // If admin replies, we can auto-mark as pending (awaiting customer reply)
    if (senderType === 'admin') {
        const adminClient = createSupabaseAdminClient();
        await adminClient
            .from('support_tickets')
            .update({ status: 'pending', updated_at: new Date().toISOString() })
            .eq('id', ticketId)
            .eq('status', 'open');
    }

    return message.id;
}
