export const dynamic = 'force-dynamic';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Eye, RefreshCw, ExternalLink } from 'lucide-react';
import { OrdersTable } from '@/components/admin/orders-table';

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
  searchParams: Promise<{ status?: string; page?: string; q?: string; from?: string; to?: string }>;
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
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    paid: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    fulfilling: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
    fulfilled: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    failed: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    expired: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status] ?? 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}>
      {status}
    </span>
  );
}

const STATUS_FILTERS = ['all', 'pending', 'paid', 'fulfilling', 'fulfilled', 'failed', 'expired'];

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { status = 'all', page = '1', q, from, to } = await searchParams;
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

  if (q) {
    const searchTerm = `%${q}%`;
    query = query.or(`id.ilike.${searchTerm},guest_email.ilike.${searchTerm}`);
  }

  if (from) {
    query = query.gte('created_at', from);
  }

  if (to) {
    query = query.lte('created_at', to + 'T23:59:59.999Z');
  }

  const { data: orders, count } = await query;

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  const { data: orderItems } = await supabase
    .from('order_items')
    .select('id, order_id, package_code, package_name, country_code, quantity, unit_price_cents')
    .in('order_id', orders?.map((o) => o.id) ?? []);

  const itemsByOrder: Record<string, OrderItemRow[]> = {};
  for (const item of orderItems ?? []) {
    if (!itemsByOrder[item.order_id]) {
      itemsByOrder[item.order_id] = [];
    }
    itemsByOrder[item.order_id].push(item);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Orders</h1>
          <p className="text-gray-600 dark:text-gray-400">{count ?? 0} total orders</p>
        </div>
        <form action="/api/admin/bulk-retry" method="POST">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Retry All Failed
          </button>
        </form>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              s === status
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      <OrdersTable 
        initialOrders={orders ?? []}
        initialItems={itemsByOrder}
        totalCount={count ?? 0}
        currentPage={pageNum}
        pageSize={pageSize}
        currentStatus={status}
      />
    </div>
  );
}
