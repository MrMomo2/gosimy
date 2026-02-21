import { NextRequest, NextResponse } from 'next/server';
import { addTicketMessage } from '@/lib/support/tickets';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// GET a specific ticket and its messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    // The RLS policy on `support_tickets` guarantees that we only get a result
    // if the user is authorized to read it (either admin or owner).
    const { data: ticket, error: ticketErr } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', id)
        .single();

    if (ticketErr || !ticket) {
        return NextResponse.json({ error: 'Ticket not found or unauthorized' }, { status: 404 });
    }

    // RLS also protects `ticket_messages`
    const { data: messages, error: msgErr } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

    if (msgErr) {
        return NextResponse.json({ error: msgErr.message }, { status: 500 });
    }

    return NextResponse.json({ ticket, messages });
}

// POST a new message to a ticket
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    // Verify ownership via RLS
    const { data: ticket, error: ticketErr } = await supabase
        .from('support_tickets')
        .select('id, guest_email')
        .eq('id', id)
        .single();

    if (ticketErr || !ticket) {
        return NextResponse.json({ error: 'Ticket not found or unauthorized' }, { status: 404 });
    }

    try {
        const { message } = await req.json();

        if (!message || message.trim() === '') {
            return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
        }

        const messageId = await addTicketMessage(id, 'customer', message, ticket.guest_email);

        return NextResponse.json({ success: true, messageId });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
