export const dynamic = 'force-dynamic';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { Mail, Search, Users } from 'lucide-react';
import Link from 'next/link';

interface CustomerAgg {
    email: string;
    total_orders: number;
    total_spent: number;
    last_order_date: string;
}

type Props = {
    searchParams: Promise<{ q?: string; page?: string }>;
};

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

export default async function AdminCustomersPage({ searchParams }: Props) {
    const { q, page = '1' } = await searchParams;
    const supabase = createSupabaseAdminClient();

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = 20;
    const offset = (pageNum - 1) * pageSize;

    let query = supabase
        .from('orders')
        .select('guest_email, amount_total, created_at, status')
        .order('created_at', { ascending: false });

    if (q) {
        const searchTerm = `%${q}%`;
        query = query.or(`guest_email.ilike.${searchTerm}`);
    }

    const { data: orders } = await query;

    const customersMap = new Map<string, CustomerAgg>();

    for (const order of orders || []) {
        const email = order.guest_email || 'Unknown User';

        const isPaid = order.status === 'paid' || order.status === 'fulfilled';
        const amount = isPaid ? (order.amount_total || 0) : 0;

        if (!customersMap.has(email)) {
            customersMap.set(email, {
                email,
                total_orders: 1,
                total_spent: amount,
                last_order_date: order.created_at,
            });
        } else {
            const existing = customersMap.get(email)!;
            existing.total_orders += 1;
            existing.total_spent += amount;
        }
    }

    const allCustomers = Array.from(customersMap.values()).sort(
        (a, b) => new Date(b.last_order_date).getTime() - new Date(a.last_order_date).getTime()
    );

    const totalCount = allCustomers.length;
    const paginatedCustomers = allCustomers.slice(offset, offset + pageSize);
    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>
                    <p className="text-gray-600 dark:text-gray-400">{totalCount} unique customers</p>
                </div>
                <form className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        name="q"
                        defaultValue={q}
                        placeholder="Search customers..."
                        className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                    />
                </form>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
                            <tr>
                                <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                                <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orders</th>
                                <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Spent</th>
                                <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Order</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedCustomers.map((customer) => (
                                <tr key={customer.email} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-4 lg:px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{customer.email}</span>
                                                <a href={`mailto:${customer.email}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5">
                                                    <Mail className="w-3 h-3" /> Contact
                                                </a>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 lg:px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                                            {customer.total_orders} Orders
                                        </span>
                                    </td>
                                    <td className="px-4 lg:px-6 py-4">
                                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(customer.total_spent)}</span>
                                    </td>
                                    <td className="px-4 lg:px-6 py-4">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(customer.last_order_date)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {paginatedCustomers.length === 0 && (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            No customers found.
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-t dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Page {pageNum} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            {pageNum > 1 && (
                                <Link
                                    href={`/admin/customers?page=${pageNum - 1}${q ? `&q=${q}` : ''}`}
                                    className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                                >
                                    Previous
                                </Link>
                            )}
                            {pageNum < totalPages && (
                                <Link
                                    href={`/admin/customers?page=${pageNum + 1}${q ? `&q=${q}` : ''}`}
                                    className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                                >
                                    Next
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
