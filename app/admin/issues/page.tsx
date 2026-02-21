export const dynamic = 'force-dynamic';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Trash2, AlertCircle } from 'lucide-react';

interface FailedOrder {
  id: string;
  status: string;
  amount_total: number;
  guest_email: string | null;
  created_at: string;
  fulfillment_log: Array<{
    error_message: string;
    created_at: string;
  }>;
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminIssuesPage() {
  const supabase = createSupabaseAdminClient();

  const { data: failedOrders } = await supabase
    .from('orders')
    .select(`
      id, status, amount_total, guest_email, created_at,
      fulfillment_log (error_message, created_at)
    `)
    .eq('status', 'failed')
    .order('created_at', { ascending: false });

  const { data: stuckOrders } = await supabase
    .from('orders')
    .select('id, status, amount_total, guest_email, created_at')
    .eq('status', 'paid')
    .order('created_at', { ascending: false });

  const { data: pendingEsims } = await supabase
    .from('esims')
    .select('id, status, iccid, created_at, provider_order_no')
    .in('status', ['pending', 'provisioning'])
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Issues & Alerts</h1>
        <p className="text-gray-600">Orders and eSIMs that need attention</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{failedOrders?.length ?? 0}</p>
              <p className="text-sm text-red-600">Failed Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">{stuckOrders?.length ?? 0}</p>
              <p className="text-sm text-yellow-600">Stuck Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{pendingEsims?.length ?? 0}</p>
              <p className="text-sm text-purple-600">Pending eSIMs</p>
            </div>
          </div>
        </div>
      </div>

      {failedOrders && failedOrders.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-6 py-4 border-b bg-red-50">
            <h2 className="text-lg font-semibold text-red-800">Failed Orders</h2>
          </div>
          <div className="divide-y">
            {(failedOrders as FailedOrder[]).map((order) => (
              <div key={order.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{order.id.slice(0, 8)}</code>
                      <span className="font-medium">{formatCurrency(order.amount_total)}</span>
                      <span className="text-sm text-gray-500">{order.guest_email ?? 'Guest'}</span>
                    </div>
                    <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
                      {order.fulfillment_log?.[0]?.error_message ?? 'Unknown error'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50"
                    >
                      View
                    </Link>
                    <form action="/api/admin/retry-fulfillment" method="POST">
                      <input type="hidden" name="orderId" value={order.id} />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        Retry
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stuckOrders && stuckOrders.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-6 py-4 border-b bg-yellow-50">
            <h2 className="text-lg font-semibold text-yellow-800">Stuck Orders (Paid but not fulfilling)</h2>
          </div>
          <div className="divide-y">
            {stuckOrders.map((order) => (
              <div key={order.id} className="p-4 flex items-center justify-between">
                <div>
                  <code className="text-sm">{order.id.slice(0, 8)}</code>
                  <span className="ml-4 text-gray-600">{formatCurrency(order.amount_total)}</span>
                  <span className="ml-4 text-sm text-gray-500">{formatDate(order.created_at)}</span>
                </div>
                <form action="/api/admin/retry-fulfillment" method="POST">
                  <input type="hidden" name="orderId" value={order.id} />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700"
                  >
                    Trigger Fulfillment
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingEsims && pendingEsims.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-6 py-4 border-b bg-purple-50">
            <h2 className="text-lg font-semibold text-purple-800">Pending eSIMs</h2>
          </div>
          <div className="divide-y">
            {pendingEsims.map((esim) => (
              <div key={esim.id} className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm">{esim.iccid ?? 'No ICCID yet'}</span>
                  <span className="ml-4 text-sm text-gray-500">Status: {esim.status}</span>
                  <span className="ml-4 text-sm text-gray-500">{formatDate(esim.created_at)}</span>
                </div>
                <form action="/api/admin/query-esim" method="POST">
                  <input type="hidden" name="esimId" value={esim.id} />
                  <input type="hidden" name="providerOrderNo" value={esim.provider_order_no ?? ''} />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                  >
                    Check Status
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!failedOrders || failedOrders.length === 0) && 
       (!stuckOrders || stuckOrders.length === 0) && 
       (!pendingEsims || pendingEsims.length === 0) && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">All Clear!</h2>
          <p className="text-gray-500">No issues requiring attention</p>
        </div>
      )}
    </div>
  );
}
