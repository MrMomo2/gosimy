import { createSupabaseAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { MessageCircle, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

function getStatusColor(status: string) {
    switch (status) {
        case 'open': return 'bg-sky-100 text-sky-800 border-sky-200';
        case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'resolved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}

function getPriorityIcon(priority: string) {
    switch (priority) {
        case 'high': return <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" title="High Priority" />;
        case 'medium': return <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" title="Medium Priority" />;
        case 'low': return <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" title="Low Priority" />;
        default: return null;
    }
}

export default async function AdminSupportPage() {
    const supabase = createSupabaseAdminClient();

    const { data: tickets } = await supabase
        .from('support_tickets')
        .select('*')
        .order('status', { ascending: true }) // Hacky way to put open first usually, but good enough
        .order('updated_at', { ascending: false });

    const ticketList = tickets || [];

    const openCount = ticketList.filter(t => t.status === 'open').length;
    const pendingCount = ticketList.filter(t => t.status === 'pending').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
                    <p className="text-gray-600 mt-1">
                        {openCount} open, {pendingCount} pending customer requests
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {ticketList.length === 0 ? (
                    <div className="p-12 text-center">
                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No support tickets</h3>
                        <p className="text-gray-500 mt-1">Your inbox is completely clear.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                <th className="px-6 py-4">Subject</th>
                                <th className="px-6 py-4 whitespace-nowrap">Customer</th>
                                <th className="px-6 py-4 whitespace-nowrap">Priority</th>
                                <th className="px-6 py-4 whitespace-nowrap">Last Updated</th>
                                <th className="px-6 py-4 text-right whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {ticketList.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getStatusColor(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {ticket.subject}
                                        </div>
                                        {ticket.order_id && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                Order: {ticket.order_id.substring(0, 8)}...
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {ticket.guest_email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {getPriorityIcon(ticket.priority)}
                                            <span className="text-sm capitalize text-gray-600">{ticket.priority}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4" />
                                            {new Date(ticket.updated_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <Link
                                            href={`/admin/support/${ticket.id}`}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                        >
                                            View Ticket &rarr;
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
