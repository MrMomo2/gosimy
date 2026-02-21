import Link from 'next/link';
import { Plane, Globe, Mail, Shield, CreditCard, Wifi } from 'lucide-react';

interface FooterProps {
  locale?: string;
}

export function Footer({ locale = 'en' }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-12">
          <div className="lg:col-span-1">
            <Link href={`/${locale}`} className="flex items-center gap-2.5 mb-5 group w-fit">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/30 transition-shadow">
                <Plane className="w-5 h-5 text-white transform -rotate-45" />
              </div>
              <span className="font-bold text-xl text-white">Gosimy</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-xs">
              Instant eSIMs for travelers worldwide. Stay connected globally without contracts or roaming fees.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="mailto:support@gosimy.com"
                className="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Email support"
              >
                <Mail className="w-4 h-4 text-gray-400" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Explore</h3>
            <ul className="space-y-3">
              <li>
                <Link href={`/${locale}/shop`} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full group-hover:bg-sky-400 transition-colors" />
                  Browse All Plans
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/shop?region=europe`} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full group-hover:bg-sky-400 transition-colors" />
                  Europe eSIMs
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/shop?region=asia`} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full group-hover:bg-sky-400 transition-colors" />
                  Asia eSIMs
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/shop?region=americas`} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full group-hover:bg-sky-400 transition-colors" />
                  Americas eSIMs
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/portal`} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full group-hover:bg-sky-400 transition-colors" />
                  My eSIMs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href={`/${locale}/faq`} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full group-hover:bg-sky-400 transition-colors" />
                  FAQ
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/how-it-works`} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full group-hover:bg-sky-400 transition-colors" />
                  How It Works
                </Link>
              </li>
              <li>
                <a href="mailto:support@gosimy.com" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full group-hover:bg-sky-400 transition-colors" />
                  Contact Us
                </a>
              </li>
              <li>
                <Link href={`/${locale}/compatibility`} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full group-hover:bg-sky-400 transition-colors" />
                  Device Compatibility
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href={`/${locale}/privacy`} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full group-hover:bg-sky-400 transition-colors" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full group-hover:bg-sky-400 transition-colors" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/imprint`} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full group-hover:bg-sky-400 transition-colors" />
                  Imprint
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/refund`} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full group-hover:bg-sky-400 transition-colors" />
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="w-full border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 lg:gap-12 w-full text-gray-400">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-sky-400" />
              <span className="text-sm font-medium">100+ Countries</span>
            </div>
            <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-gray-700" />
            <div className="flex items-center gap-3">
              <Wifi className="w-5 h-5 text-sky-400" />
              <span className="text-sm font-medium">Instant Activation</span>
            </div>
            <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-gray-700" />
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-sky-400" />
              <span className="text-sm font-medium">Secure Payments</span>
            </div>
            <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-gray-700" />
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-sky-400" />
              <span className="text-sm font-medium">No Hidden Fees</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-gray-800/80 text-sm text-gray-400">
          <span>© {year} Gosimy. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Prices in</span>
              <span className="text-gray-200 font-medium tracking-wide">USD</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 hidden sm:inline-block">Payment:</span>
              <div className="h-8 px-3 rounded bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors tooltip tooltip-top" data-tip="VISA">
                <span className="font-bold text-gray-300 text-sm italic tracking-tighter">VISA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
