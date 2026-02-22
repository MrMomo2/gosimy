import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using Gosimy eSIM services.',
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10">Last updated: February 19, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Agreement</h2>
            <p>
              By purchasing an eSIM from Gosimy (gosimy.com), you agree to these Terms of Service.
              If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. eSIM Products</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>eSIMs are <strong>digital products</strong> delivered electronically. Due to their nature, all sales are final once the QR code has been delivered.</li>
              <li>Data allowances, coverage, and speeds are as described in the package listing. Actual speeds depend on local network conditions.</li>
              <li>eSIMs are valid for the stated duration from the date of first activation, not from purchase.</li>
              <li>Coverage and network availability are provided by our upstream partner (eSIM Access) and are subject to change.</li>
              <li>Our eSIMs require a <strong>compatible, unlocked device</strong> that supports eSIM technology.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Payments & Refunds</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All prices are in USD and include applicable taxes calculated at checkout.</li>
              <li>Payments are processed securely by Dodo Payments. We do not store card details.</li>
              <li><strong>Refund Policy:</strong> Because eSIMs are digital goods delivered immediately, we generally cannot offer refunds once the QR code is delivered. Exceptions apply if:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>The eSIM was never delivered (technical failure)</li>
                  <li>The eSIM does not work in the advertised coverage area</li>
                </ul>
              </li>
              <li>Refund requests must be submitted within 14 days of purchase to <a href="mailto:support@gosimy.com" className="text-primary hover:underline">support@gosimy.com</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Acceptable Use</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Resell or redistribute eSIMs without authorization</li>
              <li>Use eSIMs for illegal activities</li>
              <li>Abuse our checkout system (automated purchases, fraud)</li>
              <li>Attempt to circumvent our rate limiting or security measures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Liability Limitation</h2>
            <p>
              Gosimy acts as a reseller of eSIM services provided by our upstream supplier.
              We are not liable for network outages, coverage gaps, or service interruptions
              by the underlying carrier. Our maximum liability is limited to the amount paid
              for the affected eSIM.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Governing Law</h2>
            <p>
              These terms are governed by the laws of the European Union. Any disputes
              shall be resolved in good faith. EU consumers retain all statutory consumer rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contact</h2>
            <p>
              For support or questions: <a href="mailto:support@gosimy.com" className="text-primary hover:underline">support@gosimy.com</a>
              <br />
              For legal matters: <a href="mailto:legal@gosimy.com" className="text-primary hover:underline">legal@gosimy.com</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
