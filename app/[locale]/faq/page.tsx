import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'FAQ — Frequently Asked Questions',
    description: 'Common questions about Gosimy eSIMs, activation, data plans, and more.',
    robots: { index: true, follow: true },
};

const faqs = [
    {
        q: 'What is an eSIM?',
        a: 'An eSIM (embedded SIM) is a digital SIM that lets you activate a data plan without a physical SIM card. It\'s built into most modern smartphones, tablets, and smartwatches.',
    },
    {
        q: 'How do I activate my eSIM?',
        a: 'After purchase, you\'ll receive a QR code by email. Simply scan it with your device\'s camera app or go to Settings → Cellular → Add eSIM → Scan QR Code. The eSIM activates instantly.',
    },
    {
        q: 'Which devices support eSIM?',
        a: 'Most iPhones from iPhone XS onwards, Samsung Galaxy S20+, Google Pixel 3+, and many other modern devices support eSIM. Check our compatibility page for the full list.',
    },
    {
        q: 'When does my eSIM data plan start?',
        a: 'Your data plan starts when you first connect to a network in your destination country, not when you purchase or install the eSIM. You can install it before your trip.',
    },
    {
        q: 'Can I use my eSIM alongside my regular SIM?',
        a: 'Yes! Most eSIM-compatible devices support dual SIM, so you can keep your regular number active while using the eSIM for data.',
    },
    {
        q: 'What happens when I run out of data?',
        a: 'Your data connection will stop. You can purchase a top-up through your portal to add more data to your existing eSIM.',
    },
    {
        q: 'Can I get a refund?',
        a: 'Since eSIMs are digital products, refunds are available only if the eSIM was never delivered or doesn\'t work in the advertised coverage area. See our Refund Policy for details.',
    },
    {
        q: 'Do I need to unlock my phone?',
        a: 'Yes, your device must be unlocked (not locked to a specific carrier) to use an eSIM from Gosimy.',
    },
    {
        q: 'Is my payment secure?',
        a: 'Absolutely. All payments are processed through Stripe, a PCI-DSS Level 1 certified payment processor. We never store your card details.',
    },
    {
        q: 'How long does delivery take?',
        a: 'Your eSIM QR code is delivered to your email within minutes of purchase. Check your spam folder if you don\'t see it right away.',
    },
];

export default function FAQPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-4 py-16">
                <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
                <p className="text-muted-foreground mb-10">Everything you need to know about Gosimy eSIMs</p>

                <div className="space-y-6">
                    {faqs.map((faq, i) => (
                        <details
                            key={i}
                            className="group border border-gray-200 rounded-xl overflow-hidden"
                        >
                            <summary className="flex items-center justify-between cursor-pointer px-6 py-4 hover:bg-gray-50 transition-colors font-medium text-gray-900">
                                {faq.q}
                                <span className="ml-4 text-gray-400 group-open:rotate-45 transition-transform text-xl">+</span>
                            </summary>
                            <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                                {faq.a}
                            </div>
                        </details>
                    ))}
                </div>
            </div>
        </div>
    );
}
