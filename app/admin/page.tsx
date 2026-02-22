export const dynamic = 'force-dynamic';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getProvider } from '@/lib/providers';
import { DollarSign, ShoppingBag, Users, Wifi, AlertTriangle, TrendingUp, Clock, Activity, ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';
import Link from 'next/link';
import { RevenueAreaChart } from '@/components/admin/charts';

interface Stats {
    totalRevenue: number;
    totalOrders: number;
    totalEsims: number;
    pendingOrders: number;
    failedOrders: number;
    activeEsims: number;
    recentOrders: Array<{
        id: string;
        status: string;
        amount_total: number;
        created_at: string;
        guest_email: string | null;
    }>;
    failedFulfillments: Array<{
        order_id: string;
        error_message: string;
        created_at: string;
    }>;
    revenue7d: number;
    revenuePrev7d: number;
    revenueChartData: Array<{ date: string; revenue: number }>;
    recentActivity: Array<{
        id: string;
        action: string;
        admin_email: string;
        resource_type: string;
        created_at: string;
    }>;
}

async function getDashboardStats(): Promise<Stats> {
    const supabase = createSupabaseAdminClient();

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const [
        { data: orders },
        { data: esims },
        { data: pendingOrders },
        { data: failedOrders },
        { data: activeEsims },
        { data: recentOrders },
        { data: failedLogs },
        { data: revenue7d },
        { data: revenuePrev7d },
        { data: dailyStats },
        { data: recentActivity },
    ] = await Promise.all([
        supabase.from('orders').select('amount_total').eq('status', 'fulfilled'),
        supabase.from('esims').select('id'),
        supabase.from('orders').select('id').eq('status', 'paid'),
        supabase.from('orders').select('id').eq('status', 'failed'),
        supabase.from('esims').select('id').eq('status', 'active'),
        supabase.from('orders').select('id, status, amount_total, created_at, guest_email').order('created_at', { ascending: false }).limit(10),
        supabase.from('fulfillment_log').select('order_id, error_message, created_at').eq('status', 'failed').order('created_at', { ascending: false }).limit(5),
        supabase.from('orders').select('amount_total').gte('created_at', sevenDaysAgo.toISOString()).in('status', ['paid', 'fulfilled', 'fulfilling']),
        supabase.from('orders').select('amount_total').gte('created_at', fourteenDaysAgo.toISOString()).lt('created_at', sevenDaysAgo.toISOString()).in('status', ['paid', 'fulfilled', 'fulfilling']),
        supabase.from('daily_stats').select('date, orders_revenue').gte('date', fourteenDaysAgo.toISOString().split('T')[0]).order('date', { ascending: true }),
        supabase.from('admin_audit_log').select('id, action, admin_email, resource_type, created_at').order('created_at', { ascending: false }).limit(10),
    ]);

    const revenueChartData = (dailyStats || []).map(d => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: (d.orders_revenue || 0) / 100,
    }));

    return {
        totalRevenue: orders?.reduce((sum, o) => sum + (o.amount_total ?? 0), 0) ?? 0,
        totalOrders: orders?.length ?? 0,
        totalEsims: esims?.length ?? 0,
        pendingOrders: pendingOrders?.length ?? 0,
        failedOrders: failedOrders?.length ?? 0,
        activeEsims: activeEsims?.length ?? 0,
        recentOrders: recentOrders ?? [],
        failedFulfillments: failedLogs ?? [],
        revenue7d: revenue7d?.reduce((sum, o) => sum + (o.amount_total ?? 0), 0) ?? 0,
        revenuePrev7d: revenuePrev7d?.reduce((sum, o) => sum + (o.amount_total ?? 0), 0) ?? 0,
        revenueChartData,
        recentActivity: recentActivity ?? [],
    };
}

async function getProviderBalance(): Promise<{ amount: number; currency: string } | null> {
    try {
        const provider = getProvider('esim_access');
        const balance = await provider.getBalance();
        return { amount: balance.amount, currency: balance.currency };
    } catch {
        return null;
    }
}

function formatCurrency(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        paid: 'bg-blue-100 text-blue-800',
        fulfilling: 'bg-purple-100 text-purple-800',
        fulfilled: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800',
        expired: 'bg-gray-100 text-gray-800',
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>
            {status}
        </span>
    );
}

export default async function AdminDashboard() {
    const [stats, providerBalance] = await Promise.all([
        getDashboardStats(),
        getProviderBalance(),
    ]);

    const revenueChange = stats.revenuePrev7d > 0
        ? ((stats.revenue7d - stats.revenuePrev7d) / stats.revenuePrev7d) * 100
        : 0;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400">Overview of your Gosimy store</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        {Math.abs(revenueChange) > 0.1 && (
                            <div className={`flex items-center gap-1 text-sm ${revenueChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {revenueChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                {Math.abs(revenueChange).toFixed(0)}%
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">7-Day Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.revenue7d)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">vs {formatCurrency(stats.revenuePrev7d)} last week</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.totalRevenue)}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                        <Wifi className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">Active eSIMs</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.activeEsims}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">Provider Balance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {providerBalance ? `$${(providerBalance.amount / 10000).toFixed(2)}` : '—'}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Revenue Trend (14 Days)</h2>
                    <Link href="/admin/analytics" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                        View Analytics
                    </Link>
                </div>
                <div className="h-64">
                    <RevenueAreaChart data={stats.revenueChartData} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Orders</h2>
                        <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                            View all
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {stats.recentOrders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                <div className="flex-1 min-w-0">
                                    <Link href={`/admin/orders/${order.id}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 truncate block">
                                        {order.guest_email ?? 'Guest'}
                                    </Link>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.created_at)}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(order.amount_total)}</span>
                                    <StatusBadge status={order.status} />
                                </div>
                            </div>
                        ))}
                        {stats.recentOrders.length === 0 && (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No orders yet</p>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Attention Required</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <Link href="/admin/orders?status=paid" className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
                                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                <div>
                                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pendingOrders}</p>
                                    <p className="text-sm text-yellow-600 dark:text-yellow-500">Pending</p>
                                </div>
                            </Link>
                            <Link href="/admin/issues" className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                <div>
                                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.failedOrders}</p>
                                    <p className="text-sm text-red-600 dark:text-red-400">Failed</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Activity</h2>
                            <Link href="/admin/audit" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                                View all
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {stats.recentActivity.slice(0, 5).map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center shrink-0">
                                        <Activity className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{activity.action}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{activity.admin_email} • {formatDate(activity.created_at)}</p>
                                    </div>
                                </div>
                            ))}
                            {stats.recentActivity.length === 0 && (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">No recent activity</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {stats.failedFulfillments.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Failed Fulfillments</h2>
                        <Link href="/admin/issues" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                            View all
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {stats.failedFulfillments.map((log) => (
                            <div key={log.order_id} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                    <code className="text-xs text-red-700 dark:text-red-400">{log.order_id.slice(0, 8)}...</code>
                                    <span className="text-xs text-red-500 dark:text-red-500">{formatDate(log.created_at)}</span>
                                </div>
                                <p className="text-sm text-red-600 dark:text-red-400 truncate">{log.error_message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
