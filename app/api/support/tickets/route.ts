import { NextRequest, NextResponse } from 'next/server';
import { createTicket, addTicketMessage } from '@/lib/support/tickets';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// GET all tickets for the currently logged-in user or guest session
export async function GET(req: NextRequest) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check for guest session
    const guestCookie = req.cookies.get('guest_session')?.value;
    let guestEmail: string | null = null;

    if (guestCookie) {
        try {
            const parsed = JSON.parse(guestCookie);
            guestEmail = parsed.email;
        } catch (e) { }
    }

    if (!user && !guestEmail) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase.from('support_tickets').select('*').order('updated_at', { ascending: false });

    if (user) {
        query = query.eq('user_id', user.id);
    } else if (guestEmail) {
        query = query.eq('guest_email', guestEmail);
    }

    const { data: tickets, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tickets });
}

// POST create a new ticket
export async function POST(req: NextRequest) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const guestCookie = req.cookies.get('guest_session')?.value;
    let guestEmail: string | null = null;

    if (guestCookie) {
        try {
            const parsed = JSON.parse(guestCookie);
            guestEmail = parsed.email;
        } catch (e) { }
    }

    const email = user?.email || guestEmail;

    if (!email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();

        if (!body.subject || !body.message) {
            return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
        }

        const ticketId = await createTicket({
            guestEmail: email,
            subject: body.subject,
            initialMessage: body.message,
            orderId: body.orderId || null,
        });

        return NextResponse.json({ success: true, ticketId });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
