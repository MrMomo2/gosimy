import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { requireAdminWith2FA } from '@/lib/auth/admin';
import { NextResponse } from 'next/server';

export async function GET() {
    let admin;
    try {
        admin = await requireAdminWith2FA();
    } catch {
        return NextResponse.json({ error: 'Unauthorized: Admin access with 2FA required' }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    const [
        { count: totalOrders },
        { data: revenueData },
        { count: activeEsims },
        { count: pendingOrders },
        { count: failedOrders },
    ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'fulfilled'),
        supabase.from('orders').select('amount_total').eq('status', 'fulfilled'),
        supabase.from('esims').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
    ]);

    const totalRevenue = revenueData?.reduce((sum, o) => sum + (o.amount_total ?? 0), 0) ?? 0;

    return NextResponse.json({
        totalRevenue,
        totalOrders: totalOrders ?? 0,
        activeEsims: activeEsims ?? 0,
        pendingOrders: pendingOrders ?? 0,
        failedOrders: failedOrders ?? 0,
    });
}
