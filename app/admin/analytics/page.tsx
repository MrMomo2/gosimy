export const dynamic = 'force-dynamic';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getProvider } from '@/lib/providers';
import { DollarSign, ShoppingBag, Users, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { RevenueAreaChart, OrdersBarChart, StatusPieChart } from '@/components/admin/charts';

interface DailyStat {
    date: string;
    orders_count: number;
    orders_revenue: number;
    new_customers: number;
    esims_activated: number;
    refunds_count: number;
    refunds_amount: number;
    failed_orders: number;
}

async function getAnalyticsData() {
    const supabase = createSupabaseAdminClient();
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
        { data: dailyStats },
        { data: ordersByStatus },
        { data: topCountries },
        { data: recentRevenue },
        { count: totalOrders },
        { count: totalCustomers },
    ] = await Promise.all([
        supabase
            .from('daily_stats')
            .select('*')
            .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
            .order('date', { ascending: true }),
        supabase
            .from('orders')
            .select('status'),
        supabase
            .from('order_items')
            .select('country_code'),
        supabase
            .from('orders')
            .select('amount_total, created_at')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .in('status', ['paid', 'fulfilled', 'fulfilling']),
        supabase
            .from('orders')
            .select('id', { count: 'exact', head: true }),
        supabase
            .from('customers')
            .select('id', { count: 'exact', head: true }),
    ]);

    const statusCounts: Record<string, number> = {};
    ordersByStatus?.forEach(o => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    const countryCounts: Record<string, number> = {};
    topCountries?.forEach(item => {
        countryCounts[item.country_code] = (countryCounts[item.country_code] || 0) + 1;
    });
    const topCountriesList = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([code, count]) => ({ code, count }));

    return {
        dailyStats: dailyStats as DailyStat[],
        statusCounts,
        topCountries: topCountriesList,
        totalOrders: totalOrders ?? 0,
        totalCustomers: totalCustomers ?? 0,
        totalRevenue30d: recentRevenue?.reduce((sum, o) => sum + (o.amount_total || 0), 0) ?? 0,
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

const STATUS_COLORS: Record<string, string> = {
    fulfilled: '#22c55e',
    paid: '#3b82f6',
    fulfilling: '#8b5cf6',
    pending: '#f59e0b',
    failed: '#ef4444',
    expired: '#6b7280',
};

export default async function AnalyticsPage() {
    const [data, providerBalance] = await Promise.all([
        getAnalyticsData(),
        getProviderBalance(),
    ]);

    const chartData = data.dailyStats.map(d => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: d.orders_revenue / 100,
        orders: d.orders_count,
        customers: d.new_customers,
        esims: d.esims_activated,
    }));

    const statusPieData = Object.entries(data.statusCounts).map(([name, value]) => ({
        name,
        value,
        color: STATUS_COLORS[name] || '#6b7280',
    }));

    const last7Days = data.dailyStats.slice(-7).reduce((sum, d) => sum + d.orders_revenue, 0);
    const prev7Days = data.dailyStats.slice(-14, -7).reduce((sum, d) => sum + d.orders_revenue, 0);
    const revenueTrend = prev7Days > 0 
        ? { percent: Math.abs(((last7Days - prev7Days) / prev7Days) * 100).toFixed(1), up: last7Days >= prev7Days }
        : { percent: '0', up: true };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-600">Revenue, orders, and customer insights</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl border p-6">
                    <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        {revenueTrend.percent !== '0' && (
                            <div className={`flex items-center gap-1 text-sm ${revenueTrend.up ? 'text-green-600' : 'text-red-600'}`}>
                                {revenueTrend.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                {revenueTrend.percent}%
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 mt-4">30-Day Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalRevenue30d)}</p>
                </div>

                <div className="bg-white rounded-xl border p-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600 mt-4">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{data.totalOrders.toLocaleString()}</p>
                </div>

                <div className="bg-white rounded-xl border p-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-600 mt-4">Total Customers</p>
                    <p className="text-2xl font-bold text-gray-900">{data.totalCustomers.toLocaleString()}</p>
                </div>

                <div className="bg-white rounded-xl border p-6">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-orange-600" />
                    </div>
                    <p className="text-sm text-gray-600 mt-4">Provider Balance</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {providerBalance ? `$${(providerBalance.amount / 10000).toFixed(2)}` : '—'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue (30 Days)</h2>
                    <div className="h-80">
                        <RevenueAreaChart data={chartData} />
                    </div>
                </div>

                <div className="bg-white rounded-xl border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h2>
                    <div className="h-80">
                        <StatusPieChart data={statusPieData} />
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {statusPieData.map((entry) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-sm text-gray-600 capitalize">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Orders (30 Days)</h2>
                    <div className="h-80">
                        <OrdersBarChart data={chartData} />
                    </div>
                </div>

                <div className="bg-white rounded-xl border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Destinations</h2>
                    <div className="space-y-4">
                        {data.topCountries.map((country, index) => (
                            <div key={country.code} className="flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-500 w-6">{index + 1}</span>
                                <img 
                                    src={`https://flagcdn.com/24x18/${country.code.toLowerCase()}.png`}
                                    alt={country.code}
                                    className="w-6 h-4 rounded"
                                />
                                <span className="flex-1 font-medium text-gray-900">{country.code}</span>
                                <span className="text-sm text-gray-500">{country.count} orders</span>
                                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{ 
                                            width: `${(country.count / (data.topCountries[0]?.count || 1)) * 100}%` 
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        {data.topCountries.length === 0 && (
                            <p className="text-gray-500 text-center py-8">No order data yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
