export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { EsimCard } from '@/components/portal/EsimCard';

type Props = { params: Promise<{ locale: string; orderId: string }> };

export default async function OrderDetailPage({ params }: Props) {
  const { locale, orderId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminClient = createSupabaseAdminClient();

  // Fetch the order and verify ownership
  const { data: order } = await adminClient
    .from('orders')
    .select('*, order_items(*, esims(*))')
    .eq('id', orderId)
    .eq('user_id', user!.id)
    .single();

  if (!order) notFound();

  const allEsims = order.order_items?.flatMap((item: { esims: unknown[] }) => item.esims) ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href={`/${locale}/portal`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My eSIMs
        </Link>

        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${order.status === 'fulfilled' ? 'bg-green-100 text-green-700' :
                order.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
              }`}>
              {order.status}
            </span>
          </div>

          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total paid</span>
            <span className="font-semibold text-lg">
              {(order.amount_total / 100).toFixed(2)} {order.currency.toUpperCase()}
            </span>
          </div>
        </div>

        {allEsims.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {order.status === 'paid' || order.status === 'fulfilling'
                ? 'Your eSIM is being prepared. Check back in a few minutes.'
                : 'No eSIMs found for this order.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allEsims.map((esim: {
              id: string;
              iccid: string | null;
              qr_code_url: string | null;
              activation_code: string | null;
              status: string;
              data_used_bytes: string | null;
              data_total_bytes: string | null;
              expires_at: string | null;
              provider: string;
            }) => (
              <EsimCard
                key={esim.id}
                id={esim.id}
                iccid={esim.iccid}
                qrCodeUrl={esim.qr_code_url}
                activationCode={esim.activation_code}
                status={esim.status}
                dataUsedBytes={esim.data_used_bytes}
                dataTotalBytes={esim.data_total_bytes}
                expiresAt={esim.expires_at}
                packageName="eSIM Plan"
                countryCode=""
                provider={esim.provider}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
