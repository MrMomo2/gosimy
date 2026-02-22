import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { validateCsrfToken } from '@/lib/auth/csrf';
import { z } from 'zod';

export const runtime = 'nodejs';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  csrfToken: z.string().length(64),
});

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.app_metadata?.provider !== 'email') {
    return NextResponse.json({ error: 'Password change is not available for OAuth accounts' }, { status: 400 });
  }

  const body = await request.json();
  const parse = schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.issues[0].message }, { status: 400 });
  }

  const { currentPassword, newPassword, csrfToken } = parse.data;

  const tokenValid = await validateCsrfToken(user.id, csrfToken);
  if (!tokenValid) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 });
  }

  // Verify current password by re-authenticating
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });
  if (signInError) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
