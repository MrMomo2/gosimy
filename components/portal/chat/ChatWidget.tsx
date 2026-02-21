'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from './ChatProvider';
import { MessageSquare, X, Send, Loader2, ArrowLeft, Clock, ShieldAlert, User, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { useParams } from 'next/navigation';

interface Ticket {
    id: string;
    subject: string;
    status: string;
    priority: string;
    updated_at: string;
}

interface Message {
    id: string;
    sender_type: 'customer' | 'admin';
    content: string;
    created_at: string;
}

function getStatusColor(status: string) {
    switch (status) {
        case 'open': return 'bg-sky-100 text-sky-800 border-sky-200';
        case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'resolved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}

export default function ChatWidget() {
    const { isOpen, setIsOpen, activeTicketId, setActiveTicketId } = useChat();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

    const [view, setView] = useState<'list' | 'chat' | 'new'>('list');
    const [isLoading, setIsLoading] = useState(false);

    // New Ticket State
    const [newSubject, setNewSubject] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const params = useParams();
    const locale = params.locale as string;

    // Fetch ticket list
    useEffect(() => {
        if (isOpen && !activeTicketId && view === 'list') {
            fetchTickets();
        }
    }, [isOpen, view, activeTicketId]);

    // Fetch active ticket messages
    useEffect(() => {
        if (isOpen && activeTicketId) {
            setView('chat');
            fetchTicketData(activeTicketId);
            const interval = setInterval(() => fetchTicketData(activeTicketId), 15000);
            return () => clearInterval(interval);
        }
    }, [isOpen, activeTicketId]);

    useEffect(() => {
        if (view === 'chat') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, view]);

    async function fetchTickets() {
        setIsLoading(true);
        try {
            const res = await fetch('/api/support/tickets');
            if (!res.ok) throw new Error('Failed to fetch tickets');
            const data = await res.json();
            setTickets(Array.isArray(data) ? data : (data?.tickets || []));
        } catch (err) {
            console.error(err);
            setTickets([]);
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchTicketData(id: string) {
        try {
            const res = await fetch(`/api/support/tickets/${id}`);
            if (!res.ok) throw new Error('Ticket not found');
            const data = await res.json();
            setActiveTicket(data.ticket);
            setMessages(data.messages);
        } catch (err) {
            console.error(err);
            setActiveTicketId(null);
            setView('list');
        }
    }

    async function handleCreateTicket(e: React.FormEvent) {
        e.preventDefault();
        if (!newSubject.trim() || !newMessage.trim()) return;

        setIsSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: newSubject, message: newMessage }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setNewSubject('');
            setNewMessage('');
            setActiveTicketId(data.ticketId);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleSendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!newMessage.trim() || isSubmitting || !activeTicketId) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/support/tickets/${activeTicketId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: newMessage }),
            });
            if (!res.ok) throw new Error('Failed to send');
            setNewMessage('');
            await fetchTicketData(activeTicketId);
        } catch (err: any) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-sky-500 hover:bg-sky-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 group"
                aria-label="Open Chat"
            >
                <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
        );
    }

    const isClosed = activeTicket?.status === 'resolved' || activeTicket?.status === 'closed';

    return (
        <div className="fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">

            {/* Header */}
            <div className="bg-sky-500 p-4 text-white shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {view !== 'list' && (
                        <button
                            onClick={() => { setActiveTicketId(null); setView('list'); }}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <h3 className="font-bold text-lg leading-tight">
                            {view === 'list' ? 'Support Chat' : view === 'new' ? 'New Conversation' : activeTicket?.subject}
                        </h3>
                        <p className="text-sky-100 text-xs">
                            {view === 'list' ? 'We typically reply in a few minutes' : activeTicket ? `Ticket #${activeTicket.id.split('-')[0]}` : ''}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 flex flex-col relative">

                {/* LIST VIEW */}
                {view === 'list' && (
                    <div className="p-4 flex flex-col h-full">
                        <button
                            onClick={() => setView('new')}
                            className="w-full bg-white border-2 border-dashed border-gray-200 hover:border-sky-300 hover:bg-sky-50 text-sky-600 font-medium p-4 rounded-xl flex items-center justify-center gap-2 transition-colors mb-4"
                        >
                            <MessageSquare className="w-5 h-5" />
                            Start a new conversation
                        </button>

                        <div className="flex-1 space-y-3 mt-2">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Your Conversations</h4>
                            {isLoading ? (
                                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-sky-500" /></div>
                            ) : tickets.length === 0 ? (
                                <div className="text-center p-8 text-gray-500 text-sm">No recent conversations.</div>
                            ) : (
                                tickets.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setActiveTicketId(t.id)}
                                        className="w-full text-left bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-sky-200 transition-colors group"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-sm text-gray-900 truncate pr-4 group-hover:text-sky-600 transition-colors">{t.subject}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize shrink-0 border ${getStatusColor(t.status)}`}>
                                                {t.status}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(t.updated_at).toLocaleDateString()}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* NEW TICKET VIEW */}
                {view === 'new' && (
                    <form onSubmit={handleCreateTicket} className="p-5 flex flex-col h-full bg-white">
                        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

                        <label className="text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <input
                            required
                            value={newSubject}
                            onChange={e => setNewSubject(e.target.value)}
                            placeholder="E.g. Cannot install eSIM"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-4 focus:ring-2 focus:ring-sky-500 outline-none"
                        />

                        <label className="text-sm font-medium text-gray-700 mb-1">How can we help?</label>
                        <textarea
                            required
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            placeholder="Describe your issue..."
                            rows={5}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-auto focus:ring-2 focus:ring-sky-500 outline-none resize-none"
                        />

                        <button
                            type="submit"
                            disabled={isSubmitting || !newSubject.trim() || !newMessage.trim()}
                            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-3.5 rounded-xl mt-6 transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Message'}
                        </button>
                    </form>
                )}

                {/* CHAT VIEW */}
                {view === 'chat' && activeTicket && (
                    <>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {messages.map((msg) => {
                                const isAdmin = msg.sender_type === 'admin';
                                return (
                                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`flex items-end gap-2 max-w-[85%] ${isAdmin ? 'flex-row' : 'flex-row-reverse'}`}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isAdmin ? 'bg-sky-100 text-sky-600' : 'bg-gray-200 text-gray-600'}`}>
                                                {isAdmin ? <ShieldAlert className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                            </div>
                                            <div className={`p-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${isAdmin ? 'bg-white border border-gray-100 rounded-bl-sm text-gray-800' : 'bg-sky-500 text-white rounded-br-sm'}`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 bg-white border-t border-gray-200 shrink-0">
                            {isClosed && (
                                <div className="text-center p-2 mb-2 bg-gray-50 rounded-lg border border-gray-100 text-[11px] text-gray-500">
                                    Ticket marked as {activeTicket.status}. Replying will reopen it.
                                </div>
                            )}
                            <form onSubmit={handleSendMessage} className={`flex items-end gap-2 ${isClosed ? 'opacity-90' : ''}`}>
                                <textarea
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Type a reply..."
                                    className="flex-1 max-h-24 min-h-[40px] bg-gray-50 p-2.5 rounded-xl border border-gray-200 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors resize-y overflow-auto text-sm outline-none"
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !newMessage.trim()}
                                    className="bg-sky-500 text-white p-2.5 rounded-xl hover:bg-sky-600 disabled:opacity-50 transition-colors shrink-0 h-[40px] w-[40px] flex items-center justify-center"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
