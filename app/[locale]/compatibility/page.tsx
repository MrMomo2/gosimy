import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { COMPATIBLE_DEVICES_DB } from '@/lib/data/compatible-devices';
import { Smartphone, CheckCircle, Search, Check, X } from 'lucide-react';
import DeviceSearch from '@/components/search/DeviceSearch';
import Link from 'next/link';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    return {
        title: 'eSIM Compatible Devices List | Gosimy',
        description: 'Check if your smartphone, tablet, or smartwatch supports eSIM technology. Full compatibility list for Apple iPhone, Samsung Galaxy, Google Pixel, and more.',
        alternates: { canonical: `/${locale}/compatibility` }
    };
}

export default async function CompatibilityPage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale });

    return (
        <div className="bg-gray-50 min-h-screen pb-24">
            {/* Hero Header & Search */}
            <section className="bg-white border-b border-gray-100 pt-20 pb-16 px-4">
                <div className="container max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
                        <Smartphone className="w-4 h-4" /> eSIM Compatibility
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                        Supported Devices
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-6">
                        Quickly verify if your smartphone, tablet, or smartwatch supports eSIM technology by typing your model below.
                    </p>

                    <DeviceSearch />
                </div>
            </section>

            {/* Database Grid */}
            <section className="container max-w-6xl mx-auto mt-12 px-4">

                {/* Important Note */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-12 flex gap-4 text-blue-800">
                    <div className="shrink-0 mt-1">
                        <Search className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-1">How to check your settings</h3>
                        <p className="text-sm text-blue-700 leading-relaxed mb-3">
                            Even if your phone is listed below, some devices purchased in China, Hong Kong, or Macao may not have eSIM capability. Your phone must also be <strong>carrier-unlocked</strong>. You can verify in your settings:
                        </p>
                        <ul className="text-sm space-y-2 list-disc pl-5 opacity-90">
                            <li><strong>iOS:</strong> Go to Settings &gt; Cellular. If you see &quot;Add eSIM&quot; or &quot;Add Cellular Plan&quot;, you are good to go.</li>
                            <li><strong>Android:</strong> Go to Settings &gt; Connections &gt; SIM manager or Network & Internet. If you see &quot;Add eSIM&quot;, you are supported.</li>
                        </ul>
                    </div>
                </div>

                {/* Brands Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {COMPATIBLE_DEVICES_DB.map((brand) => (
                        <div key={brand.name} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                                    <Smartphone className="w-5 h-5 text-gray-500" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">{brand.name}</h2>
                            </div>

                            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                {brand.devices.map((device, idx) => (
                                    <li key={idx} className="flex items-center justify-between gap-3 text-sm text-gray-700 py-1 border-b border-gray-50 last:border-0">
                                        <span>{device}</span>
                                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Device Compatible?</h3>
                    <Link
                        href={`/${locale}/shop`}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-xl hover:shadow-blue-500/25"
                    >
                        Start Browsing eSIMs
                    </Link>
                </div>
            </section>
        </div>
    );
}
