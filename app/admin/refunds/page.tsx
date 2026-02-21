export const dynamic = 'force-dynamic';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { DollarSign, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface RefundRequest {
  id: string;
  order_id: string;
  user_email: string | null;
  amount_cents: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  created_at: string;
  processed_at: string | null;
}

type Props = {
  searchParams: Promise<{ status?: string }>;
};

const STATUS_CONFIG: Record<string, { color: string; icon: typeof Clock }> = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
  processed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
};

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
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

export default async function AdminRefundsPage({ searchParams }: Props) {
  const { status = 'all' } = await searchParams;
  const supabase = createSupabaseAdminClient();

  const { data: refundRequests, count } = await supabase
    .from('refund_requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  const filteredRequests = status === 'all' 
    ? refundRequests 
    : refundRequests?.filter((r) => r.status === status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Refunds</h1>
          <p className="text-gray-600">{count ?? 0} refund requests</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {['pending', 'approved', 'rejected', 'processed'].map((s) => {
          const config = STATUS_CONFIG[s];
          const count = refundRequests?.filter((r) => r.status === s).length ?? 0;
          return (
            <Link
              key={s}
              href={`/admin/refunds?status=${s}`}
              className={`p-4 rounded-xl border ${
                status === s ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                  <config.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-gray-500 capitalize">{s}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {filteredRequests && filteredRequests.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Request ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRequests.map((req: RefundRequest) => {
                const config = STATUS_CONFIG[req.status];
                return (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <code className="text-sm">{req.id.slice(0, 8)}...</code>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${req.order_id}`} className="text-blue-600 hover:underline text-sm">
                        {req.order_id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-medium">{formatCurrency(req.amount_cents)}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 line-clamp-2">{req.reason}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(req.created_at)}</td>
                    <td className="px-6 py-4">
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <form action="/api/admin/refunds/approve" method="POST">
                            <input type="hidden" name="refundId" value={req.id} />
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                            >
                              Approve
                            </button>
                          </form>
                          <form action="/api/admin/refunds/reject" method="POST">
                            <input type="hidden" name="refundId" value={req.id} />
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-gray-500">
            No refund requests found
          </div>
        )}
      </div>
    </div>
  );
}
