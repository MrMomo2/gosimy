export const dynamic = 'force-dynamic';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Eye, QrCode, RefreshCw, AlertCircle } from 'lucide-react';

interface EsimRow {
  id: string;
  order_item_id: string;
  user_id: string | null;
  provider: string;
  provider_order_no: string | null;
  esim_tran_no: string | null;
  iccid: string | null;
  qr_code_url: string | null;
  activation_code: string | null;
  smdp_status: string | null;
  status: string;
  data_used_bytes: string | null;
  data_total_bytes: string | null;
  expires_at: string | null;
  last_queried_at: string | null;
  created_at: string;
  order_items: Array<{
    package_name: string;
    country_code: string;
    duration_days: number;
    order_id: string;
    orders: Array<{ guest_email: string | null }> | null;
  }> | null;
}

type Props = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

function formatBytes(bytes: string | null): string {
  if (!bytes) return '—';
  const b = Number(bytes);
  if (b >= 1073741824) return `${(b / 1073741824).toFixed(1)} GB`;
  if (b >= 1048576) return `${(b / 1048576).toFixed(0)} MB`;
  return `${bytes} B`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    provisioning: 'bg-purple-100 text-purple-800',
    active: 'bg-green-100 text-green-800',
    exhausted: 'bg-orange-100 text-orange-800',
    expired: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-gray-100 text-gray-600',
    failed: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}

function DataUsageBar({ used, total }: { used: string | null; total: string | null }) {
  if (!total) return <span className="text-gray-400">—</span>;
  const usedNum = used ? Number(used) : 0;
  const totalNum = Number(total);
  const percent = totalNum > 0 ? (usedNum / totalNum) * 100 : 0;
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">{formatBytes(used)}/{formatBytes(total)}</span>
    </div>
  );
}

const STATUS_FILTERS = ['all', 'pending', 'provisioning', 'active', 'exhausted', 'expired', 'cancelled', 'failed'];

export default async function AdminEsimsPage({ searchParams }: Props) {
  const { status = 'all', page = '1' } = await searchParams;
  const supabase = createSupabaseAdminClient();

  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSize = 20;
  const offset = (pageNum - 1) * pageSize;

  let query = supabase
    .from('esims')
    .select(`
      id, order_item_id, user_id, provider, provider_order_no, esim_tran_no, iccid,
      qr_code_url, activation_code, smdp_status, status, data_used_bytes, data_total_bytes,
      expires_at, last_queried_at, created_at,
      order_items (
        package_name, country_code, duration_days, order_id,
        orders (guest_email)
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: esims, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">eSIMs</h1>
          <p className="text-gray-600">{count ?? 0} total eSIMs</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s}
            href={`/admin/esims?status=${s}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              s === status
                ? 'bg-blue-600 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ICCID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Data Usage</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(esims as EsimRow[])?.map((esim) => {
                const item = esim.order_items?.[0];
                return (
                  <tr key={esim.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <code className="text-sm text-gray-900">{esim.iccid ?? 'Pending...'}</code>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item?.package_name ?? 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{item?.country_code} • {item?.duration_days} days</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={esim.status} />
                        {esim.smdp_status && (
                          <span className="text-xs text-gray-400">SMDP: {esim.smdp_status}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-[200px]">
                      <DataUsageBar used={esim.data_used_bytes} total={esim.data_total_bytes} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{formatDate(esim.expires_at)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{formatDate(esim.created_at)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/esims/${esim.id}`}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {esim.qr_code_url && (
                          <a
                            href={esim.qr_code_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </a>
                        )}
                        {esim.status === 'active' && (
                          <form action="/api/admin/query-esim" method="POST">
                            <input type="hidden" name="esimId" value={esim.id} />
                            <input type="hidden" name="iccid" value={esim.iccid ?? ''} />
                            <button
                              type="submit"
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Refresh status"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-gray-500">Page {pageNum} of {totalPages}</p>
            <div className="flex gap-2">
              {pageNum > 1 && (
                <Link href={`/admin/esims?status=${status}&page=${pageNum - 1}`} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                  Previous
                </Link>
              )}
              {pageNum < totalPages && (
                <Link href={`/admin/esims?status=${status}&page=${pageNum + 1}`} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
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
