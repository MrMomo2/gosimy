import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { requireAdminWith2FA } from '@/lib/auth/admin';
import { NextRequest, NextResponse } from 'next/server';
import { logAdminAction } from '@/lib/admin/audit';

export async function GET(req: NextRequest) {
    let admin;
    try {
        admin = await requireAdminWith2FA();
    } catch {
        return NextResponse.json({ error: 'Unauthorized: Admin access with 2FA required' }, { status: 401 });
    }

    const resource = req.nextUrl.searchParams.get('resource');
    const startDate = req.nextUrl.searchParams.get('start');
    const endDate = req.nextUrl.searchParams.get('end');
    const status = req.nextUrl.searchParams.get('status');

    if (!resource || !['orders', 'customers', 'esims', 'refunds'].includes(resource)) {
        return NextResponse.json({ error: 'Invalid resource' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    let csv = '';
    const filename = `${resource}-${new Date().toISOString().slice(0, 10)}.csv`;

    const startFilter = startDate ? new Date(startDate).toISOString() : undefined;
    const endFilter = endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined;

    if (resource === 'orders') {
        let query = supabase
            .from('orders')
            .select('id, status, currency, amount_total, guest_email, locale, ip_address, created_at, updated_at')
            .order('created_at', { ascending: false });

        if (startFilter) query = query.gte('created_at', startFilter);
        if (endFilter) query = query.lte('created_at', endFilter);
        if (status) query = query.eq('status', status);

        const { data } = await query;

        csv = 'ID,Status,Currency,Amount,Email,Locale,IP Address,Created,Updated\n';
        csv += (data ?? []).map(o =>
            `${o.id},${o.status},${o.currency},${((o.amount_total ?? 0) / 100).toFixed(2)},"${o.guest_email ?? ''}",${o.locale ?? ''},${o.ip_address ?? ''},${o.created_at},${o.updated_at ?? ''}`
        ).join('\n');
    }

    if (resource === 'customers') {
        let query = supabase
            .from('orders')
            .select('guest_email, amount_total, status, created_at, ip_address')
            .order('created_at', { ascending: false });

        if (startFilter) query = query.gte('created_at', startFilter);
        if (endFilter) query = query.lte('created_at', endFilter);

        const { data: orders } = await query;

        const map = new Map<string, { email: string; orders: number; spent: number; lastOrder: string; ips: Set<string> }>();
        for (const o of orders ?? []) {
            const email = o.guest_email || 'Unknown';
            const isPaid = o.status === 'paid' || o.status === 'fulfilled' || o.status === 'fulfilling';
            if (!map.has(email)) {
                map.set(email, { 
                    email, 
                    orders: 1, 
                    spent: isPaid ? (o.amount_total || 0) : 0, 
                    lastOrder: o.created_at,
                    ips: new Set([o.ip_address || ''])
                });
            } else {
                const e = map.get(email)!;
                e.orders++;
                if (isPaid) e.spent += o.amount_total || 0;
                if (o.ip_address) e.ips.add(o.ip_address);
            }
        }

        csv = 'Email,Total Orders,Total Spent (USD),Last Order,IPs Used\n';
        csv += Array.from(map.values()).map(c =>
            `"${c.email}",${c.orders},${(c.spent / 100).toFixed(2)},${c.lastOrder},"${Array.from(c.ips).join('; ')}"`
        ).join('\n');
    }

    if (resource === 'esims') {
        let query = supabase
            .from('esims')
            .select(`
                id, iccid, provider, provider_order_no, status, smdp_status, 
                data_total_bytes, data_used_bytes, expires_at, created_at,
                order_items ( package_name, country_code )
            `)
            .order('created_at', { ascending: false });

        if (startFilter) query = query.gte('created_at', startFilter);
        if (endFilter) query = query.lte('created_at', endFilter);
        if (status) query = query.eq('status', status);

        const { data } = await query;

        csv = 'ID,ICCID,Provider,Package,Country,Status,SMDP Status,Total Data (MB),Used Data (MB),Expires,Created\n';
        csv += (data ?? []).map(e => {
            const item = e.order_items as any;
            return `${e.id},${e.iccid ?? ''},${e.provider},"${item?.package_name ?? ''}",${item?.country_code ?? ''},${e.status},${e.smdp_status ?? ''},${e.data_total_bytes ? (Number(e.data_total_bytes) / 1048576).toFixed(0) : ''},${e.data_used_bytes ? (Number(e.data_used_bytes) / 1048576).toFixed(0) : ''},${e.expires_at ?? ''},${e.created_at}`;
        }).join('\n');
    }

    if (resource === 'refunds') {
        let query = supabase
            .from('refund_requests')
            .select('id, order_id, amount_cents, reason, status, created_at, processed_at')
            .order('created_at', { ascending: false });

        if (startFilter) query = query.gte('created_at', startFilter);
        if (endFilter) query = query.lte('created_at', endFilter);
        if (status) query = query.eq('status', status);

        const { data } = await query;

        csv = 'ID,Order ID,Amount (USD),Reason,Status,Created,Processed\n';
        csv += (data ?? []).map(r =>
            `${r.id},${r.order_id},${((r.amount_cents ?? 0) / 100).toFixed(2)},"${(r.reason ?? '').replace(/"/g, '""')}",${r.status},${r.created_at},${r.processed_at ?? ''}`
        ).join('\n');
    }

    await logAdminAction(
        supabase,
        admin.email || 'unknown',
        'export_csv',
        resource,
        'all',
        { startDate, endDate, status }
    );

    return new Response(csv, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    });
}
