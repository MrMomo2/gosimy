export const dynamic = 'force-dynamic';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';

interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_cents: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatusBadge({ isActive, validFrom, validUntil }: { isActive: boolean; validFrom: string; validUntil: string | null }) {
  const now = new Date();
  const start = new Date(validFrom);
  const end = validUntil ? new Date(validUntil) : null;

  if (!isActive) {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Inactive</span>;
  }
  if (start > now) {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Scheduled</span>;
  }
  if (end && end < now) {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Expired</span>;
  }
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>;
}

export default async function AdminCouponsPage() {
  const supabase = createSupabaseAdminClient();

  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-gray-600">Manage discount codes and promotions</p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </Link>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {coupons && coupons.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Discount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Min. Order</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Usage</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Valid</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(coupons as CouponRow[]).map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <code className="font-mono font-medium text-blue-600">{coupon.code}</code>
                    </div>
                    {coupon.description && (
                      <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">
                      {coupon.discount_type === 'percentage' 
                        ? `${coupon.discount_value}%` 
                        : formatCurrency(coupon.discount_value)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatCurrency(coupon.min_order_cents)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">
                      {coupon.used_count}
                      {coupon.max_uses !== null && ` / ${coupon.max_uses}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>
                      <span>{formatDate(coupon.valid_from)}</span>
                      {coupon.valid_until && (
                        <>
                          <span className="text-gray-400"> — </span>
                          <span>{formatDate(coupon.valid_until)}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge 
                      isActive={coupon.is_active} 
                      validFrom={coupon.valid_from} 
                      validUntil={coupon.valid_until} 
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/coupons/${coupon.id}`}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <form action={`/api/admin/coupons/${coupon.id}/delete`} method="POST">
                        <button
                          type="submit"
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No coupons yet</p>
            <Link href="/admin/coupons/new" className="text-blue-600 hover:underline">
              Create your first coupon
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
