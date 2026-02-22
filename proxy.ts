import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const locales = ['en', 'de', 'fr', 'es'];
const defaultLocale = 'en';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

// Controlled via MAINTENANCE_MODE env var ('true' / 'false')
const IS_MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  // Admin routes always allowed
  if (pathname.startsWith('/admin')) {
    return await updateSession(request);
  }

  // 1. Check Maintenance Mode
  const hasBypassCookie = request.cookies.has('admin_bypass');
  const isApi = pathname.startsWith('/api/');
  const isMaintenancePath = pathname.match(/^\/([a-z]{2}\/)?maintenance$/);

  // If maintenance is enabled, user has no bypass, it's not an API call, and not already on the maintenance page
  if (IS_MAINTENANCE_MODE && !hasBypassCookie && !isApi && !isMaintenancePath) {
    const localeMatch = pathname.match(/^\/([a-z]{2})(?:\/|$)/);
    const locale = (localeMatch && locales.includes(localeMatch[1])) ? localeMatch[1] : defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/maintenance`, request.url));
  }

  // 2. Normal Request Processing
  const response = await updateSession(request);

  const intlResponse = intlMiddleware(request);

  if (intlResponse) {
    intlResponse.headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
    response.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie.name, cookie.value);
    });
    return intlResponse;
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
