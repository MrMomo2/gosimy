import { createSupabaseAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCouponPage({ params }: Props) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const isNew = id === 'new';

  let coupon = null;
  if (!isNew) {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single();
    coupon = data;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/coupons" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Coupons
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? 'Create Coupon' : 'Edit Coupon'}
        </h1>
      </div>

      <form action={`/api/admin/coupons/${isNew ? 'create' : id + '/update'}`} method="POST" className="max-w-xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
          <input
            type="text"
            name="code"
            defaultValue={coupon?.code ?? ''}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="SUMMER2024"
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            name="description"
            defaultValue={coupon?.description ?? ''}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Summer sale - 20% off"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
            <select
              name="discount_type"
              defaultValue={coupon?.discount_type ?? 'percentage'}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount ($)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
            <input
              type="number"
              name="discount_value"
              defaultValue={coupon?.discount_value ?? 10}
              required
              min="1"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount ($)</label>
          <input
            type="number"
            name="min_order_cents"
            defaultValue={coupon ? coupon.min_order_cents / 100 : 0}
            min="0"
            step="0.01"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Uses (leave empty for unlimited)</label>
          <input
            type="number"
            name="max_uses"
            defaultValue={coupon?.max_uses ?? ''}
            min="1"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
            <input
              type="datetime-local"
              name="valid_from"
              defaultValue={coupon?.valid_from ? new Date(coupon.valid_from).toISOString().slice(0, 16) : ''}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
            <input
              type="datetime-local"
              name="valid_until"
              defaultValue={coupon?.valid_until ? new Date(coupon.valid_until).toISOString().slice(0, 16) : ''}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={coupon?.is_active ?? true}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {isNew ? 'Create Coupon' : 'Save Changes'}
          </button>
          <Link
            href="/admin/coupons"
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
