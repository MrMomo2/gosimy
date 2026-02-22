export const dynamic = 'force-dynamic';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Tag } from 'lucide-react';
import { CouponsTable } from '@/components/admin/coupons-table';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Coupons</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage discount codes and promotions</p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </Link>
      </div>

      <CouponsTable initialCoupons={coupons as CouponRow[] ?? []} />
    </div>
  );
}
