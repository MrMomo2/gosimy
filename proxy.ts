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

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  // If accessing admin routes, verify session but DO NOT redirect to locale
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return await updateSession(request);
  }

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
