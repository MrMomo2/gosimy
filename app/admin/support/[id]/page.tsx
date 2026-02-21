'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, User, ShieldAlert, Clock, Info, CheckCircle, RefreshCcw, Tag } from 'lucide-react';

interface Ticket {
    id: string;
    guest_email: string;
    subject: string;
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
    orders?: any;
}

interface Message {
    id: string;
    sender_type: 'customer' | 'admin';
    content: string;
    created_at: string;
}

export default function AdminTicketChatPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    async function fetchTicketData() {
        try {
            const res = await fetch(`/api/admin/support/${resolvedParams.id}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setTicket(data.ticket);
            setMessages(data.messages);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchTicketData();
        const interval = setInterval(fetchTicketData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [resolvedParams.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function handleAction(action: 'reply' | 'change_status', payload: any) {
        if (action === 'reply' && !payload.message.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/admin/support/${resolvedParams.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...payload }),
            });

            if (!res.ok) throw new Error('Action failed');

            if (action === 'reply') setNewMessage('');
            await fetchTicketData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
    if (!ticket) return <div className="p-8 text-center text-gray-500">Ticket not found</div>;

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">

            {/* LEFT: Chat Area */}
            <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/support" className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h2 className="font-bold text-gray-900">{ticket.subject}</h2>
                            <p className="text-sm text-gray-500">{ticket.guest_email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={ticket.status}
                            onChange={(e) => handleAction('change_status', { status: e.target.value })}
                            className={`text-sm rounded-lg border-gray-200 font-medium focus:ring-blue-500 focus:border-blue-500 ${ticket.status === 'open' ? 'bg-blue-50 text-blue-700' :
                                    ticket.status === 'resolved' ? 'bg-green-50 text-green-700' :
                                        'bg-gray-50 text-gray-700'
                                }`}
                            disabled={isSubmitting}
                        >
                            <option value="open">Open</option>
                            <option value="pending">Pending</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-100 space-y-6">
                    {messages.map((msg) => {
                        const isCustomer = msg.sender_type === 'customer';
                        return (
                            <div key={msg.id} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                                <div className={`flex items-start gap-3 max-w-[80%] ${isCustomer ? 'flex-row' : 'flex-row-reverse'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isCustomer ? 'bg-white border text-gray-500' : 'bg-blue-600 text-white'}`}>
                                        {isCustomer ? <User className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                    </div>
                                    <div className={`p-4 rounded-2xl shadow-sm ${isCustomer ? 'bg-white border text-gray-800 rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'}`}>
                                        <div className="whitespace-pre-wrap text-[15px]">{msg.content}</div>
                                        <div className={`text-[11px] mt-2 flex items-center gap-1 ${isCustomer ? 'text-gray-400' : 'text-blue-200'}`}>
                                            <Clock className="w-3 h-3" />
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Reply Box */}
                <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleAction('reply', { message: newMessage }); }}
                        className="flex items-end gap-3"
                    >
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your reply to the customer..."
                            className="flex-1 max-h-32 min-h-[44px] bg-gray-50 p-3 rounded-xl border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y text-sm"
                            rows={2}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAction('reply', { message: newMessage });
                                }
                            }}
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting || !newMessage.trim()}
                            className="px-6 h-[44px] bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Send
                        </button>
                    </form>
                </div>
            </div>

            {/* RIGHT: Context Sidebar */}
            <div className="w-80 flex flex-col gap-6 shrink-0">

                {/* Customer Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        Customer Details
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Email Address</p>
                            <p className="text-sm font-medium text-gray-900 break-all">{ticket.guest_email}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Ticket Priority</p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                {ticket.priority}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Created</p>
                            <p className="text-sm text-gray-900">{new Date(ticket.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Order Info */}
                {ticket.orders && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-gray-400" />
                            Related Order
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Order ID</p>
                                <Link href={`/admin/orders?q=${ticket.orders.id}`} className="text-sm font-medium text-blue-600 hover:underline break-all">
                                    {ticket.orders.id}
                                </Link>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Status</p>
                                <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium capitalize border ${ticket.orders.status === 'paid' || ticket.orders.status === 'fulfilled'
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                    {ticket.orders.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Amount</p>
                                <p className="text-sm font-medium text-gray-900">
                                    ${(ticket.orders.total_amount_cents / 100).toFixed(2)} {ticket.orders.currency.toUpperCase()}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
