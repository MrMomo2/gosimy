export const dynamic = 'force-dynamic';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { Mail, Search, Users } from 'lucide-react';

interface CustomerAgg {
    email: string;
    total_orders: number;
    total_spent: number;
    last_order_date: string;
}

function formatCurrency(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default async function AdminCustomersPage() {
    const supabase = createSupabaseAdminClient();

    const { data: orders } = await supabase
        .from('orders')
        .select('guest_email, amount_total, created_at, status')
        .order('created_at', { ascending: false });

    const customersMap = new Map<string, CustomerAgg>();

    for (const order of orders || []) {
        const email = order.guest_email || 'Unknown User';

        // Only count revenue for paid/fulfilled orders
        const isPaid = order.status === 'paid' || order.status === 'fulfilled';
        const amount = isPaid ? (order.amount_total || 0) : 0;

        if (!customersMap.has(email)) {
            customersMap.set(email, {
                email,
                total_orders: 1,
                total_spent: amount,
                last_order_date: order.created_at, // Orders are sorted desc, so first seen is latest
            });
        } else {
            const existing = customersMap.get(email)!;
            existing.total_orders += 1;
            existing.total_spent += amount;
            // Date is already the latest because of the query order
        }
    }

    const customers = Array.from(customersMap.values());

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                    <p className="text-gray-600">{customers.length} unique customers</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Contact</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Order Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {customers.map((customer) => (
                                <tr key={customer.email} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{customer.email}</span>
                                                <a href={`mailto:${customer.email}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                                                    <Mail className="w-3 h-3" /> Contact
                                                </a>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {customer.total_orders} Orders
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-gray-900">{formatCurrency(customer.total_spent)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-500">{formatDate(customer.last_order_date)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {customers.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            No customers found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
