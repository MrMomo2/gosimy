import type { Metadata } from 'next';
import { Plane, Wifi, Smartphone, Zap } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'How It Works',
    description: 'Learn how to buy, install, and activate your Gosimy eSIM in 4 easy steps.',
    robots: { index: true, follow: true },
};

const steps = [
    {
        icon: Plane,
        title: 'Choose Your Destination',
        description: 'Browse our catalog of 100+ countries. Select a data plan that matches your travel needs — whether it\'s a quick weekend trip or a month-long adventure.',
        color: 'from-sky-400 to-blue-500',
        shadow: 'shadow-sky-500/30',
    },
    {
        icon: Smartphone,
        title: 'Checkout Securely',
        description: 'Pay with any major credit card through our secure checkout. All payments are encrypted and PCI-DSS compliant.',
        color: 'from-violet-400 to-purple-500',
        shadow: 'shadow-violet-500/30',
    },
    {
        icon: Wifi,
        title: 'Receive Your QR Code',
        description: 'Within minutes, you\'ll receive your eSIM QR code by email. You can also find it in your customer portal at any time.',
        color: 'from-emerald-400 to-green-500',
        shadow: 'shadow-emerald-500/30',
    },
    {
        icon: Zap,
        title: 'Scan & Connect',
        description: 'Scan the QR code with your phone\'s camera. The eSIM installs instantly. Your data plan activates when you arrive at your destination and connect to a local network.',
        color: 'from-amber-400 to-orange-500',
        shadow: 'shadow-amber-500/30',
    },
];

export default function HowItWorksPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-4 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold mb-4">How It Works</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Get connected in 4 simple steps. No stores, no contracts, no SIM swaps.
                    </p>
                </div>

                <div className="space-y-12">
                    {steps.map((step, i) => (
                        <div key={i} className="flex gap-6 items-start">
                            <div className="shrink-0">
                                <div className="relative">
                                    <div className={`w-14 h-14 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg ${step.shadow}`}>
                                        <step.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <span className="absolute -top-2 -right-2 w-7 h-7 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {i + 1}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h2>
                                <p className="text-gray-600 leading-relaxed">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center bg-gradient-to-r from-sky-50 to-blue-50 rounded-3xl p-10">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to get started?</h3>
                    <p className="text-gray-600 mb-6">Browse eSIM plans for your next destination.</p>
                    <Link
                        href="/en/shop"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold rounded-xl hover:from-sky-600 hover:to-blue-600 transition-all shadow-lg shadow-sky-500/25"
                    >
                        Browse Plans
                    </Link>
                </div>
            </div>
        </div>
    );
}
