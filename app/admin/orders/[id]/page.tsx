export const dynamic = 'force-dynamic';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, ExternalLink, Package, AlertTriangle } from 'lucide-react';

type Props = {
    params: Promise<{ id: string }>;
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
        refunded: 'bg-gray-100 text-gray-800 border-gray-200',
        expired: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>
            {status.toUpperCase()}
        </span>
    );
}

export default async function OrderDetailsPage({ params }: Props) {
    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

    if (!order) {
        notFound();
    }

    const [
        { data: orderItems },
        { data: esims },
        { data: logs }
    ] = await Promise.all([
        supabase.from('order_items').select('*').eq('order_id', id),
        supabase.from('esims').select('*').eq('order_id', id),
        supabase.from('fulfillment_log').select('*').eq('order_id', id).order('created_at', { ascending: false })
    ]);

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center gap-4">
                <Link href="/admin/orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                    <p className="text-gray-600">{order.id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Col - Overview */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Items</h2>
                            <StatusBadge status={order.status} />
                        </div>

                        <div className="space-y-4">
                            {orderItems?.map((item) => (
                                <div key={item.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900">{item.package_name}</p>
                                        <p className="text-sm text-gray-500">Code: {item.package_code} • Qty: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">{formatCurrency(item.unit_price_cents, order.currency)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Generated eSIMs</h2>
                        {esims && esims.length > 0 ? (
                            <div className="space-y-3">
                                {esims.map((esim) => (
                                    <div key={esim.id} className="p-4 border rounded-lg flex items-center justify-between bg-gray-50">
                                        <div>
                                            <p className="font-medium text-gray-900">ICCID: {esim.iccid ?? 'Pending'}</p>
                                            <p className="text-sm text-gray-500">Status: <span className="font-semibold">{esim.status}</span></p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm italic">No eSIMs generated yet.</p>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Fulfillment Logs</h2>
                        {logs && logs.length > 0 ? (
                            <div className="space-y-3">
                                {logs.map((log) => (
                                    <div key={log.id} className={`p-3 border rounded-lg text-sm ${log.status === 'failed' ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
                                        <div className="flex justify-between font-medium mb-1">
                                            <span className={log.status === 'failed' ? 'text-red-800' : 'text-gray-800'}>
                                                {log.status.toUpperCase()}
                                            </span>
                                            <span className="text-gray-500">{formatDate(log.created_at)}</span>
                                        </div>
                                        {log.error_message && <p className="text-red-600 mt-1 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {log.error_message}</p>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm italic">No fulfillment events logged.</p>
                        )}
                    </div>
                </div>

                {/* Right Col - Customer details */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h2>
                        <div className="space-y-4 text-sm">
                            <div>
                                <p className="text-gray-500 mb-1">Email</p>
                                <p className="font-medium text-gray-900">{order.guest_email ?? 'Unknown'}</p>
                            </div>
                            {order.user_id && (
                                <div>
                                    <p className="text-gray-500 mb-1">User ID</p>
                                    <code className="text-xs bg-gray-100 p-1 rounded">{order.user_id}</code>
                                </div>
                            )}
                            <div>
                                <p className="text-gray-500 mb-1">Created At</p>
                                <p className="font-medium text-gray-900">{formatDate(order.created_at)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment & Actions</h2>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between border-b pb-3">
                                <span className="text-gray-500">Amount Total</span>
                                <span className="font-bold text-gray-900">{formatCurrency(order.amount_total, order.currency)}</span>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Payment Session</p>
                                <a
                                    href={`https://dashboard.dodopayments.com/payments/${order.payment_session_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                >
                                    View in Dodo <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                            {order.payment_invoice_id && (
                                <div>
                                    <p className="text-gray-500 mb-1">Invoice</p>
                                    <a
                                        href={order.payment_invoice_id}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                    >
                                        View Invoice <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            )}

                            <div className="pt-4 space-y-2">
                                {order.status === 'failed' && (
                                    <form action="/api/admin/retry-fulfillment" method="POST">
                                        <input type="hidden" name="orderId" value={order.id} />
                                        <button type="submit" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                                            <RefreshCw className="w-4 h-4" /> Retry Fulfillment
                                        </button>
                                    </form>
                                )}
                                {(order.status === 'paid' || order.status === 'fulfilled') && (
                                    <div className="p-3 bg-gray-50 rounded-lg border text-gray-600 text-xs text-center italic">
                                        Refunds can be initiated from the Admin Refunds page or Dodo Dashboard.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
