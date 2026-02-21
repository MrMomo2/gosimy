import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Gosimy collects, uses, and protects your personal data.',
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: February 19, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Who We Are</h2>
            <p>
              Gosimy (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the website gosimy.com and provides
              instant eSIM data services for international travelers. For questions about this
              policy, contact us at: <a href="mailto:support@gosimy.com" className="text-primary hover:underline">support@gosimy.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Data We Collect</h2>
            <p className="mb-2">We collect the following personal data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account data:</strong> Email address, name (when you register or use Google OAuth)</li>
              <li><strong>Order data:</strong> Products purchased, payment amount, delivery email</li>
              <li><strong>eSIM data:</strong> ICCID, activation codes, data usage (from our eSIM provider)</li>
              <li><strong>Technical data:</strong> IP address (for fraud prevention), browser type, device information</li>
              <li><strong>Payment data:</strong> Processed exclusively by Dodo Payments — we never store card details</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To fulfill your eSIM order and deliver your QR code by email</li>
              <li>To manage your customer account and portal access</li>
              <li>To prevent fraud and abuse (IP-based rate limiting)</li>
              <li>To comply with legal and tax obligations</li>
              <li>To send transactional emails about your orders (not marketing unless you opt in)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Legal Basis (GDPR)</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Contract performance:</strong> Processing your order (Art. 6(1)(b) GDPR)</li>
              <li><strong>Legal obligation:</strong> Tax and accounting requirements (Art. 6(1)(c) GDPR)</li>
              <li><strong>Legitimate interest:</strong> Fraud prevention, service security (Art. 6(1)(f) GDPR)</li>
              <li><strong>Consent:</strong> Optional analytics and cookies (Art. 6(1)(a) GDPR)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Third-Party Services</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dodo Payments</strong> (payments) — <a href="https://dodopayments.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
              <li><strong>Supabase</strong> (database & auth) — <a href="https://supabase.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
              <li><strong>Resend</strong> (transactional email) — <a href="https://resend.com/legal/privacy-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
              <li><strong>eSIM Access</strong> (eSIM provisioning) — your ICCID and order data is shared with this provider to fulfill your order</li>
              <li><strong>Vercel</strong> (hosting) — <a href="https://vercel.com/legal/privacy-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Order records: 10 years (tax/accounting requirements per § 147 AO)</li>
              <li>Account data: Until account deletion requested</li>
              <li>eSIM usage data: 90 days after eSIM expiry</li>
              <li>IP addresses (rate limiting): 30 days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights</h2>
            <p className="mb-2">Under GDPR, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access</strong> your personal data</li>
              <li><strong>Rectify</strong> inaccurate data</li>
              <li><strong>Erase</strong> your data (&quot;right to be forgotten&quot;) — subject to legal retention requirements</li>
              <li><strong>Data portability</strong></li>
              <li><strong>Object</strong> to processing based on legitimate interest</li>
              <li><strong>Withdraw consent</strong> at any time</li>
            </ul>
            <p className="mt-2">
              To exercise your rights, email <a href="mailto:support@gosimy.com" className="text-primary hover:underline">support@gosimy.com</a>.
              You also have the right to lodge a complaint with your national data protection authority.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Cookies</h2>
            <p>
              We use strictly necessary cookies for authentication (Supabase session) and cart persistence (localStorage).
              We only use additional analytics cookies with your explicit consent.
              You can manage your cookie preferences at any time via the banner at the bottom of the page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. We will notify registered users by email of
              material changes. The &quot;last updated&quot; date at the top will always reflect the latest version.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
