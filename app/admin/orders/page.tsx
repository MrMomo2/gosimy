export const dynamic = 'force-dynamic';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Eye, RefreshCw, ExternalLink } from 'lucide-react';

interface OrderRow {
  id: string;
  user_id: string | null;
  payment_session_id: string;
  status: string;
  currency: string;
  amount_total: number;
  guest_email: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  package_code: string;
  package_name: string;
  country_code: string;
  quantity: number;
  unit_price_cents: number;
}

type Props = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

function formatCurrency(cents: number, currency: string = 'usd'): string {
  const symbol = currency === 'eur' ? '€' : currency === 'gbp' ? '£' : '$';
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paid: 'bg-blue-100 text-blue-800 border-blue-200',
    fulfilling: 'bg-purple-100 text-purple-800 border-purple-200',
    fulfilled: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    expired: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}

const STATUS_FILTERS = ['all', 'pending', 'paid', 'fulfilling', 'fulfilled', 'failed', 'expired'];

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { status = 'all', page = '1' } = await searchParams;
  const supabase = createSupabaseAdminClient();

  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSize = 20;
  const offset = (pageNum - 1) * pageSize;

  let query = supabase
    .from('orders')
    .select('id, user_id, payment_session_id, status, currency, amount_total, guest_email, created_at, updated_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: orders, count } = await query;

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  const { data: orderItems } = await supabase
    .from('order_items')
    .select('id, order_id, package_code, package_name, country_code, quantity, unit_price_cents')
    .in('order_id', orders?.map((o) => o.id) ?? []);

  const itemsByOrder = new Map<string, OrderItemRow[]>();
  for (const item of orderItems ?? []) {
    if (!itemsByOrder.has(item.order_id)) {
      itemsByOrder.set(item.order_id, []);
    }
    itemsByOrder.get(item.order_id)!.push(item);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">{count ?? 0} total orders</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
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
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders?.map((order) => {
                const items = itemsByOrder.get(order.id) ?? [];
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <code className="text-sm text-gray-900">{order.id.slice(0, 8)}...</code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{order.guest_email ?? 'User'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {items.map((item) => (
                          <span key={item.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                            {item.package_name.slice(0, 20)}{item.package_name.length > 20 ? '...' : ''} ×{item.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.amount_total, order.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{formatDate(order.created_at)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {order.status === 'failed' && (
                          <form action="/api/admin/retry-fulfillment" method="POST">
                            <input type="hidden" name="orderId" value={order.id} />
                            <button
                              type="submit"
                              className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Retry fulfillment"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </form>
                        )}
                        <a
                          href={`https://dashboard.dodopayments.com/payments/${order.payment_session_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View in Dodo"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
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
            <p className="text-sm text-gray-500">
              Page {pageNum} of {totalPages}
            </p>
            <div className="flex gap-2">
              {pageNum > 1 && (
                <Link
                  href={`/admin/orders?status=${status}&page=${pageNum - 1}`}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {pageNum < totalPages && (
                <Link
                  href={`/admin/orders?status=${status}&page=${pageNum + 1}`}
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
