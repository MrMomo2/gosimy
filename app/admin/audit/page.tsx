export const dynamic = 'force-dynamic';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { FileText, User, Clock, Filter, Search, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

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
    searchParams: Promise<{ action?: string; admin?: string; resource?: string; page?: string }>;
};

const ACTION_COLORS: Record<string, string> = {
    create: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    update: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    delete: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    refund: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    retry: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    login: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    logout: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    export: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    bulk: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const RESOURCE_LABELS: Record<string, string> = {
    order: 'Order',
    customer: 'Customer',
    esim: 'eSIM',
    coupon: 'Coupon',
    refund: 'Refund',
    admin: 'Admin',
    auth: 'Auth',
    orders: 'Orders',
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
    return ACTION_COLORS[baseAction] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
}

export default async function AuditLogPage({ searchParams }: Props) {
    const { action = 'all', admin, resource, page = '1' } = await searchParams;
    const supabase = createSupabaseAdminClient();

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = 25;
    const offset = (pageNum - 1) * pageSize;

    let query = supabase
        .from('admin_audit_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

    if (action !== 'all') {
        query = query.ilike('action', `%${action}%`);
    }

    if (admin) {
        query = query.ilike('admin_email', `%${admin}%`);
    }

    if (resource && resource !== 'all') {
        query = query.eq('resource_type', resource);
    }

    const { data: logs, count } = await query;
    const totalPages = Math.ceil((count ?? 0) / pageSize);

    const { data: distinctActions } = await supabase
        .from('admin_audit_log')
        .select('action')
        .order('action');

    const uniqueActions = [...new Set(distinctActions?.map(l => l.action) || [])];

    const { data: distinctResources } = await supabase
        .from('admin_audit_log')
        .select('resource_type')
        .order('resource_type');

    const uniqueResources = [...new Set(distinctResources?.map(l => l.resource_type) || [])];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Audit Log</h1>
                    <p className="text-gray-600 dark:text-gray-400">{count ?? 0} total entries</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
                <Filter className="w-5 h-5 text-gray-400" />
                
                <select 
                    className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                <select 
                    className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={resource ?? 'all'}
                    onChange={(e) => {
                        const url = new URL(window.location.href);
                        if (e.target.value === 'all') {
                            url.searchParams.delete('resource');
                        } else {
                            url.searchParams.set('resource', e.target.value);
                        }
                        window.location.href = url.toString();
                    }}
                >
                    <option value="all">All Resources</option>
                    {uniqueResources.map(r => (
                        <option key={r} value={r}>{RESOURCE_LABELS[r] || r}</option>
                    ))}
                </select>

                <form className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        name="admin"
                        defaultValue={admin ?? ''}
                        placeholder="Filter by admin..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const url = new URL(window.location.href);
                                if (e.currentTarget.value) {
                                    url.searchParams.set('admin', e.currentTarget.value);
                                } else {
                                    url.searchParams.delete('admin');
                                }
                                window.location.href = url.toString();
                            }
                        }}
                    />
                </form>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
                            <tr>
                                <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Timestamp</th>
                                <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Admin</th>
                                <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                                <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Resource</th>
                                <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Details</th>
                                <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {(logs as AuditLog[])?.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 lg:px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <Clock className="w-4 h-4" />
                                            <span className="whitespace-nowrap">{formatDate(log.created_at)}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 lg:px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                                <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[150px]">{log.admin_email}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 lg:px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 lg:px-6 py-4">
                                        <div>
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {RESOURCE_LABELS[log.resource_type] || log.resource_type}
                                            </span>
                                            {log.resource_id && (
                                                <Link 
                                                    href={`/admin/${log.resource_type === 'order' || log.resource_type === 'orders' ? 'orders/' : ''}${log.resource_id}`}
                                                    className="block text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                                >
                                                    {log.resource_id.slice(0, 8)}...
                                                    <ExternalLink className="w-3 h-3" />
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 lg:px-6 py-4">
                                        {Object.keys(log.details).length > 0 ? (
                                            <details className="text-sm">
                                                <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                                    <ChevronDown className="w-4 h-4" />
                                                    View details
                                                </summary>
                                                <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs overflow-x-auto max-w-[300px] max-h-[200px] overflow-y-auto">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            </details>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500 text-sm">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 lg:px-6 py-4">
                                        <code className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{log.ip_address || '—'}</code>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-t dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Page {pageNum} of {totalPages} ({count ?? 0} entries)
                        </p>
                        <div className="flex gap-2">
                            {pageNum > 1 && (
                                <Link
                                    href={`/admin/audit?page=${pageNum - 1}${action !== 'all' ? `&action=${action}` : ''}${resource && resource !== 'all' ? `&resource=${resource}` : ''}${admin ? `&admin=${admin}` : ''}`}
                                    className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                                >
                                    Previous
                                </Link>
                            )}
                            {pageNum < totalPages && (
                                <Link
                                    href={`/admin/audit?page=${pageNum + 1}${action !== 'all' ? `&action=${action}` : ''}${resource && resource !== 'all' ? `&resource=${resource}` : ''}${admin ? `&admin=${admin}` : ''}`}
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
