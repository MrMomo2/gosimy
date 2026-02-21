'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, User, Globe, LogOut, Wifi, Settings, ChevronDown, Plane, Menu, X, LayoutDashboard } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { NavbarSearch } from '@/components/search/NavbarSearch';
import { useState, useEffect, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useTranslations } from 'next-intl';

const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
};

const LOCALES = ['en', 'de', 'fr', 'es'];

export function Navbar({ locale }: { locale: string }) {
  const t = useTranslations();
  const [cartOpen, setCartOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const localeMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        setUserRole(data?.role ?? null);
      }
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        setUserRole(data?.role ?? null);
      } else {
        setUserRole(null);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase.auth, supabase]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (localeMenuRef.current && !localeMenuRef.current.contains(e.target as Node)) {
        setLocaleOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
    setLocaleOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserOpen(false);
    router.push(`/${locale}`);
    router.refresh();
  };

  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  return (
    <>
      <nav
        className={`sticky top-0 z-40 transition-all duration-300 ${scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-white/20'
          : 'bg-white/50 backdrop-blur-sm border-b border-gray-100/50'
          }`}
        aria-label="Main navigation"
      >
        <div className="container">
          <div className="flex items-center h-16 justify-between gap-4 lg:gap-6">

            {/* Left side: Logo & Search */}
            <div className="flex items-center gap-6 flex-1">
              {/* Logo */}
              <Link href={`/${locale}`} className="flex items-center shrink-0 group">
                <span className="font-extrabold text-2xl tracking-tight gradient-text">
                  Gosimy
                </span>
              </Link>

              {/* Search */}
              <div className="hidden md:flex flex-1 max-w-md">
                <NavbarSearch locale={locale} />
              </div>
            </div>

            {/* Right Actions - Grouped in a Pill */}
            <div className="flex items-center shrink-0 bg-gray-50/80 backdrop-blur border border-gray-200/50 rounded-full p-1 shadow-sm">

              {/* Locale Selector */}
              <div className="relative" ref={localeMenuRef}>
                <button
                  onClick={() => setLocaleOpen(!localeOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white transition-colors"
                  aria-expanded={localeOpen}
                  aria-haspopup="true"
                  aria-label="Select language"
                >
                  <Globe className="w-4 h-4 text-gray-500" aria-hidden="true" />
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                    {locale.toUpperCase()}
                  </span>
                </button>
                {localeOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 min-w-[140px] animate-in fade-in slide-in-from-top-2"
                    role="menu"
                  >
                    {LOCALES.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => switchLocale(loc)}
                        className={`w-full px-4 py-2 text-sm text-left flex items-center justify-between hover:bg-gray-50 transition-colors ${loc === locale ? 'text-blue-600 font-medium bg-blue-50/50' : 'text-gray-700'
                          }`}
                        role="menuitem"
                      >
                        {LOCALE_NAMES[loc]}
                        {loc === locale && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-[1px] h-4 bg-gray-200 mx-1" />

              {/* User Menu */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserOpen(!userOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white transition-colors"
                    aria-expanded={userOpen}
                    aria-haspopup="true"
                    aria-label={`User menu for ${displayName}`}
                  >
                    {avatarUrl ? (
                      <div className="relative w-6 h-6 rounded-full overflow-hidden border border-gray-200">
                        <img src={avatarUrl} alt="" className="object-cover w-full h-full" />
                      </div>
                    ) : (
                      <User className="w-4 h-4 text-gray-500" aria-hidden="true" />
                    )}
                    <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${userOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>

                  {userOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 w-64 animate-in fade-in slide-in-from-top-2"
                      role="menu"
                    >
                      <div className="px-4 py-3 border-b border-gray-100 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50 border border-gray-200 mb-2 flex items-center justify-center">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="object-cover w-full h-full" />
                          ) : (
                            <User className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <p className="font-semibold text-gray-900 truncate w-full">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5 w-full">{user!.email}</p>
                        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-gray-100 text-gray-600">
                          {userRole || 'Customer'}
                        </div>
                      </div>
                      <div className="px-2 py-2 space-y-1">
                        {userRole === 'admin' && (
                          <a
                            href="/admin"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors group"
                            role="menuitem"
                          >
                            <LayoutDashboard className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" aria-hidden="true" />
                            Admin Dashboard
                          </a>
                        )}
                        <Link
                          href={`/${locale}/portal`}
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors group"
                          role="menuitem"
                        >
                          <Wifi className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" aria-hidden="true" />
                          {t('nav.portal')}
                        </Link>
                        <Link
                          href={`/${locale}/profile`}
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors group"
                          role="menuitem"
                        >
                          <Settings className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" aria-hidden="true" />
                          {t('nav.profile')}
                        </Link>
                      </div>
                      <div className="border-t border-gray-100 pt-2 px-2">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                          role="menuitem"
                        >
                          <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600 transition-colors" aria-hidden="true" />
                          {t('nav.signOut')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={`/${locale}/auth/login`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white transition-colors"
                >
                  <User className="w-4 h-4 text-gray-500" aria-hidden="true" />
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">{t('nav.signIn')}</span>
                </Link>
              )}


              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label={`Shopping cart with ${mounted ? itemCount : 0} items`}
              >
                <ShoppingCart className="w-5 h-5 text-gray-600" aria-hidden="true" />
                {mounted && itemCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-sky-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm"
                    aria-hidden="true"
                  >
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors lg:hidden"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-600" aria-hidden="true" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-100 py-4 space-y-2">

              <Link
                href={`/${locale}/shop?region=americas`}
                className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                {t('shop.filters.americas')}
              </Link>
              <div className="pt-2 md:hidden">
                <NavbarSearch locale={locale} />
              </div>
            </div>
          )}
        </div>
      </nav>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} locale={locale} />
    </>
  );
}
