export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { EsimCard } from '@/components/portal/EsimCard';
import { ContactSupportButton } from '@/components/portal/ContactSupportButton';
import Link from 'next/link';
import { ExternalLink, Plane, Sparkles, Plus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'My eSIMs',
  robots: { index: false, follow: false },
};

interface EsimRow {
  id: string;
  iccid: string | null;
  qr_code_url: string | null;
  activation_code: string | null;
  status: string;
  data_used_bytes: string | null;
  data_total_bytes: string | null;
  expires_at: string | null;
  provider: string;
  order_item_id: string;
  order_items: {
    package_name: string;
    country_code: string;
    duration_days: number;
    order_id: string;
  } | null;
}

type Props = { params: Promise<{ locale: string }> };

export default async function PortalPage({ params }: Props) {
  const { locale } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminClient = createSupabaseAdminClient();
  const { data: esims } = await adminClient
    .from('esims')
    .select('*, order_items(package_name, country_code, duration_days, order_id)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  const esimList = (esims ?? []) as EsimRow[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container py-8 md:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My eSIMs</h1>
            <p className="text-gray-500 mt-1">Manage your active eSIM plans</p>
          </div>
          <div className="flex items-center gap-3">
            <ContactSupportButton locale={locale} style="ghost" />
            <Link
              href={`/${locale}/shop`}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Buy New eSIM
            </Link>
          </div>
        </div>

        {esimList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center max-w-lg mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-sky-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Plane className="w-10 h-10 text-sky-500 transform -rotate-45" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No eSIMs yet</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Purchase your first eSIM plan to stay connected while traveling the world.
            </p>
            <Link
              href={`/${locale}/shop`}
              className="btn-primary"
            >
              <Sparkles className="w-4 h-4" />
              Browse eSIM Plans
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {esimList.map((esim) => {
              const orderId = esim.order_items?.order_id;
              return (
                <div key={esim.id} className="relative group">
                  <EsimCard
                    id={esim.id}
                    iccid={esim.iccid}
                    qrCodeUrl={esim.qr_code_url}
                    activationCode={esim.activation_code}
                    status={esim.status}
                    dataUsedBytes={esim.data_used_bytes}
                    dataTotalBytes={esim.data_total_bytes}
                    expiresAt={esim.expires_at}
                    packageName={esim.order_items?.package_name ?? 'eSIM Plan'}
                    countryCode={esim.order_items?.country_code ?? ''}
                    provider={esim.provider}
                  />
                  {orderId && (
                    <div className="mt-3 flex justify-end">
                      <Link
                        href={`/${locale}/portal/${orderId}`}
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-sky-600 transition-colors font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View order details
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
