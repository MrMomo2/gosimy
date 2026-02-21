import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Refund Policy',
    description: 'Refund policy for Gosimy eSIM purchases.',
    robots: { index: true, follow: true },
};

export default function RefundPolicyPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-4 py-16">
                <h1 className="text-3xl font-bold mb-2">Refund Policy</h1>
                <p className="text-muted-foreground mb-10">Last updated: February 20, 2026</p>

                <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">Digital Product Notice</h2>
                        <p>
                            eSIMs are <strong>digital products</strong> delivered electronically via QR code.
                            Due to their nature, all sales are final once the QR code has been delivered
                            and the eSIM has been activated.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">When We Issue Refunds</h2>
                        <p className="mb-2">We will issue a full refund in the following cases:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>The eSIM was <strong>never delivered</strong> due to a technical failure on our end</li>
                            <li>The eSIM <strong>does not work</strong> in the advertised coverage area despite correct installation</li>
                            <li>You were <strong>charged twice</strong> for the same order (duplicate charge)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">When Refunds Are Not Possible</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>The eSIM has already been activated and used</li>
                            <li>The eSIM has expired after its validity period</li>
                            <li>Your device does not support eSIM technology (please check compatibility before purchasing)</li>
                            <li>Network speeds are slower than expected (speeds depend on local carrier conditions)</li>
                            <li>You purchased the wrong destination or data plan</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">How to Request a Refund</h2>
                        <p>
                            To request a refund, email us at{' '}
                            <a href="mailto:support@gosimy.com" className="text-primary hover:underline">
                                support@gosimy.com
                            </a>{' '}
                            within <strong>14 days</strong> of your purchase with:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>Your order number or confirmation email</li>
                            <li>A description of the issue</li>
                            <li>Any relevant screenshots</li>
                        </ul>
                        <p className="mt-2">
                            We aim to respond to all refund requests within 2 business days. Approved refunds
                            are processed back to your original payment method within 5–10 business days.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">EU Consumer Rights</h2>
                        <p>
                            Under EU consumer law, the right of withdrawal does not apply to digital content
                            that has been fully delivered with the consumer&apos;s prior consent and acknowledgment
                            that the right of withdrawal is lost. By purchasing an eSIM, you consent to
                            immediate delivery and acknowledge this.
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
}
