export const dynamic = 'force-dynamic';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { FileText, User, Clock, Filter } from 'lucide-react';

interface AuditLog {
    id: string;
    admin_email: string;
    action: string;
    resource_type: string;
    resource_id: string | null;
    details: Record<string, unknown>;
    ip_address: string | null;
    created_at: string;
}

type Props = {
    searchParams: Promise<{ action?: string; admin?: string; page?: string }>;
};

const ACTION_COLORS: Record<string, string> = {
    create: 'bg-green-100 text-green-800',
    update: 'bg-blue-100 text-blue-800',
    delete: 'bg-red-100 text-red-800',
    refund: 'bg-yellow-100 text-yellow-800',
    retry: 'bg-purple-100 text-purple-800',
    login: 'bg-gray-100 text-gray-800',
    logout: 'bg-gray-100 text-gray-800',
    export: 'bg-indigo-100 text-indigo-800',
};

const RESOURCE_LABELS: Record<string, string> = {
    order: 'Order',
    customer: 'Customer',
    esim: 'eSIM',
    coupon: 'Coupon',
    refund: 'Refund',
    admin: 'Admin',
    auth: 'Auth',
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

function getActionColor(action: string): string {
    const baseAction = action.toLowerCase().split('_')[0];
    return ACTION_COLORS[baseAction] || 'bg-gray-100 text-gray-800';
}

export default async function AuditLogPage({ searchParams }: Props) {
    const { action = 'all', admin: adminFilter, page = '1' } = await searchParams;
    const supabase = createSupabaseAdminClient();

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = 50;
    const offset = (pageNum - 1) * pageSize;

    let query = supabase
        .from('admin_audit_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

    if (action !== 'all') {
        query = query.ilike('action', `%${action}%`);
    }

    if (adminFilter) {
        query = query.ilike('admin_email', `%${adminFilter}%`);
    }

    const { data: logs, count } = await query;
    const totalPages = Math.ceil((count ?? 0) / pageSize);

    const { data: distinctActions } = await supabase
        .from('admin_audit_log')
        .select('action')
        .order('action');

    const uniqueActions = [...new Set(distinctActions?.map(l => l.action) || [])];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
                    <p className="text-gray-600">{count ?? 0} total entries</p>
                </div>
            </div>

            <div className="flex gap-4 items-center bg-white rounded-xl border p-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <select 
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={action}
                    onChange={(e) => {
                        const url = new URL(window.location.href);
                        if (e.target.value === 'all') {
                            url.searchParams.delete('action');
                        } else {
                            url.searchParams.set('action', e.target.value);
                        }
                        window.location.href = url.toString();
                    }}
                >
                    <option value="all">All Actions</option>
                    {uniqueActions.map(a => (
                        <option key={a} value={a}>{a}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Admin</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Resource</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Details</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {(logs as AuditLog[])?.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Clock className="w-4 h-4" />
                                            {formatDate(log.created_at)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                <User className="w-4 h-4 text-gray-500" />
                                            </div>
                                            <span className="text-sm font-medium">{log.admin_email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <span className="text-sm font-medium text-gray-900">
                                                {RESOURCE_LABELS[log.resource_type] || log.resource_type}
                                            </span>
                                            {log.resource_id && (
                                                <Link 
                                                    href={`/admin/orders/${log.resource_id}`}
                                                    className="block text-xs text-blue-600 hover:underline"
                                                >
                                                    {log.resource_id.slice(0, 8)}...
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {Object.keys(log.details).length > 0 ? (
                                            <details className="text-sm">
                                                <summary className="cursor-pointer text-blue-600 hover:underline">
                                                    View details
                                                </summary>
                                                <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            </details>
                                        ) : (
                                            <span className="text-gray-400 text-sm">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="text-xs text-gray-500">{log.ip_address || '—'}</code>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t">
                        <p className="text-sm text-gray-500">
                            Page {pageNum} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            {pageNum > 1 && (
                                <Link
                                    href={`/admin/audit?page=${pageNum - 1}${action !== 'all' ? `&action=${action}` : ''}`}
                                    className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
                                >
                                    Previous
                                </Link>
                            )}
                            {pageNum < totalPages && (
                                <Link
                                    href={`/admin/audit?page=${pageNum + 1}${action !== 'all' ? `&action=${action}` : ''}`}
                                    className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
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
