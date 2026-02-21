-- Custom Types
CREATE TYPE ticket_status AS ENUM ('open', 'pending', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE ticket_sender AS ENUM ('customer', 'admin');

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guest_email TEXT NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    status ticket_status DEFAULT 'open'::ticket_status NOT NULL,
    priority ticket_priority DEFAULT 'medium'::ticket_priority NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ticket Messages Table
CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    sender_type ticket_sender NOT NULL,
    sender_email TEXT NOT NULL,
    content TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_guest_email ON public.support_tickets(guest_email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- RLS Policies for support_tickets
-- --------------------------------------------------------

-- Admins can do everything
CREATE POLICY "Admins can manage all tickets"
    ON public.support_tickets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- Customers can read their own tickets (by user_id)
CREATE POLICY "Users can read own tickets"
    ON public.support_tickets
    FOR SELECT
    USING (auth.uid() = user_id);

-- Customers can create their own tickets
CREATE POLICY "Users can create tickets"
    ON public.support_tickets
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Customers can update their own tickets (e.g., mark as closed)
CREATE POLICY "Users can update own tickets"
    ON public.support_tickets
    FOR UPDATE
    USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- RLS Policies for ticket_messages
-- --------------------------------------------------------

-- Admins can do everything
CREATE POLICY "Admins can manage all messages"
    ON public.ticket_messages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- Customers can read messages for their tickets
CREATE POLICY "Users can read own ticket messages"
    ON public.ticket_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE support_tickets.id = ticket_messages.ticket_id
            AND support_tickets.user_id = auth.uid()
        )
    );

-- Customers can send messages to their tickets
CREATE POLICY "Users can insert own ticket messages"
    ON public.ticket_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE support_tickets.id = ticket_messages.ticket_id
            AND support_tickets.user_id = auth.uid()
        )
    );

-- --------------------------------------------------------
-- Triggers
-- --------------------------------------------------------
-- Auto-update updated_at on tickets
CREATE OR REPLACE FUNCTION update_support_tickets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_tickets_modtime
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_support_tickets_timestamp();

-- Auto-update ticket updated_at when a new message is added
CREATE OR REPLACE FUNCTION touch_ticket_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.support_tickets
    SET updated_at = timezone('utc'::text, now())
    WHERE id = NEW.ticket_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_touch_ticket_on_message
    AFTER INSERT ON public.ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION touch_ticket_on_message();
