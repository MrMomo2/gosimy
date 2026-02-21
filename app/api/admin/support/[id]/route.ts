import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { addTicketMessage } from '@/lib/support/tickets';
import { requireAdminWith2FA } from '@/lib/auth/admin';

export const runtime = 'nodejs';

// GET a ticket and its messages for the admin panel
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    let admin;
    try {
        admin = await requireAdminWith2FA();
    } catch {
        return NextResponse.json({ error: 'Unauthorized: Admin access with 2FA required' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    const { data: ticket, error: ticketErr } = await supabase
        .from('support_tickets')
        .select('*, orders(*)')
        .eq('id', id)
        .single();

    if (ticketErr || !ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

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

// POST admin reply or status change
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    let admin;
    try {
        admin = await requireAdminWith2FA();
    } catch {
        return NextResponse.json({ error: 'Unauthorized: Admin access with 2FA required' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    try {
        const body = await req.json();

        // Handle Status Change
        if (body.action === 'change_status') {
            const { status } = body;
            const { error } = await supabase
                .from('support_tickets')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw new Error(error.message);
            return NextResponse.json({ success: true, status });
        }

        // Handle Reply
        if (body.action === 'reply') {
            const { message } = body;
            if (!message || message.trim() === '') {
                return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
            }

            const messageId = await addTicketMessage(id, 'admin', message, admin.email);
            return NextResponse.json({ success: true, messageId });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
