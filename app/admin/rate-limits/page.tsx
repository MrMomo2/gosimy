export const dynamic = 'force-dynamic';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { AlertTriangle, Clock, Globe, Shield, Ban } from 'lucide-react';

interface RateLimitEntry {
    ip_address: string;
    request_count: number;
    first_request: string;
    last_request: string;
    blocked: boolean;
}

async function getRateLimitData() {
    const supabase = createSupabaseAdminClient();
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentOrders } = await supabase
        .from('orders')
        .select('ip_address, created_at')
        .gte('created_at', oneHourAgo)
        .not('ip_address', 'is', null);

    const ipMap = new Map<string, { count: number; first: string; last: string }>();
    
    recentOrders?.forEach(order => {
        if (!order.ip_address) return;
        const existing = ipMap.get(order.ip_address);
        if (existing) {
            existing.count++;
            existing.last = order.created_at;
        } else {
            ipMap.set(order.ip_address, {
                count: 1,
                first: order.created_at,
                last: order.created_at,
            });
        }
    });

    const rateLimitData: RateLimitEntry[] = Array.from(ipMap.entries())
        .map(([ip, data]) => ({
            ip_address: ip,
            request_count: data.count,
            first_request: data.first,
            last_request: data.last,
            blocked: data.count >= 10,
        }))
        .sort((a, b) => b.request_count - a.request_count);

    return {
        recentIps: rateLimitData,
        totalRequests: recentOrders?.length ?? 0,
        suspiciousIps: rateLimitData.filter(ip => ip.request_count >= 5),
        blockedIps: rateLimitData.filter(ip => ip.blocked),
    };
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default async function RateLimitPage() {
    const data = await getRateLimitData();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Rate Limiting</h1>
                <p className="text-gray-600">Monitor checkout attempts and suspicious activity</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl border p-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                        <Globe className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600">Unique IPs (1h)</p>
                    <p className="text-2xl font-bold text-gray-900">{data.recentIps.length}</p>
                </div>

                <div className="bg-white rounded-xl border p-6">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                        <Clock className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600">Total Requests (1h)</p>
                    <p className="text-2xl font-bold text-gray-900">{data.totalRequests}</p>
                </div>

                <div className="bg-white rounded-xl border p-6">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <p className="text-sm text-gray-600">Suspicious (5+ req)</p>
                    <p className="text-2xl font-bold text-gray-900">{data.suspiciousIps.length}</p>
                </div>

                <div className="bg-white rounded-xl border p-6">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                        <Ban className="w-6 h-6 text-red-600" />
                    </div>
                    <p className="text-sm text-gray-600">Rate Limited (10+)</p>
                    <p className="text-2xl font-bold text-gray-900">{data.blockedIps.length}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="px-6 py-4 border-b bg-red-50">
                        <h2 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                            <Ban className="w-5 h-5" />
                            Rate Limited IPs
                        </h2>
                    </div>
                    {data.blockedIps.length > 0 ? (
                        <div className="divide-y">
                            {data.blockedIps.map((ip) => (
                                <div key={ip.ip_address} className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{ip.ip_address}</code>
                                        <span className="text-sm font-medium text-red-600">{ip.request_count} requests</span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {formatDate(ip.first_request)} - {formatDate(ip.last_request)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            No rate limited IPs in the last hour
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="px-6 py-4 border-b bg-yellow-50">
                        <h2 className="text-lg font-semibold text-yellow-800 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Suspicious Activity
                        </h2>
                    </div>
                    {data.suspiciousIps.length > 0 ? (
                        <div className="divide-y max-h-96 overflow-y-auto">
                            {data.suspiciousIps.map((ip) => (
                                <div key={ip.ip_address} className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{ip.ip_address}</code>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-medium ${ip.blocked ? 'text-red-600' : 'text-yellow-600'}`}>
                                                {ip.request_count} requests
                                            </span>
                                            {ip.blocked && (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">BLOCKED</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {formatDate(ip.first_request)} - {formatDate(ip.last_request)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            No suspicious activity in the last hour
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">All Recent IP Activity (Last Hour)</h2>
                </div>
                {data.recentIps.length > 0 ? (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">IP Address</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Requests</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">First Request</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Last Request</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data.recentIps.slice(0, 20).map((ip) => (
                                <tr key={ip.ip_address} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <code className="text-sm font-mono">{ip.ip_address}</code>
                                    </td>
                                    <td className="px-6 py-4 font-medium">{ip.request_count}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(ip.first_request)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(ip.last_request)}</td>
                                    <td className="px-6 py-4">
                                        {ip.blocked ? (
                                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-medium">RATE LIMITED</span>
                                        ) : ip.request_count >= 5 ? (
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">WARNING</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium">OK</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        No checkout activity in the last hour
                    </div>
                )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-blue-900 mb-1">Rate Limiting Rules</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• <strong>Authenticated users:</strong> Max 10 orders per hour</li>
                            <li>• <strong>Guest users:</strong> Max 5 orders per hour per IP</li>
                            <li>• Rate limits reset every hour</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
