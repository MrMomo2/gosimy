import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from './admin';
import { validateCsrfToken } from './csrf';

export async function withAdminAuth(
  request: NextRequest,
  handler: (admin: { id: string; email: string | undefined; role: string }) => Promise<NextResponse>
): Promise<NextResponse> {
  const admin = await getAdminUser();
  
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!admin.twoFactorEnabled) {
    return NextResponse.json({ error: '2FA must be enabled for admin access' }, { status: 403 });
  }

  let csrfToken: string | null = request.headers.get('x-csrf-token');
  
  if (!csrfToken) {
    try {
      const formData = await request.clone().formData();
      csrfToken = formData.get('csrf_token') as string | null;
    } catch {
      // Not form data, skip
    }
  }

  if (!csrfToken || !(await validateCsrfToken(admin.id, csrfToken))) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  return handler(admin);
}

export async function requireAdminApi(): Promise<{ id: string; email: string | undefined; role: string } | null> {
  return getAdminUser();
}
