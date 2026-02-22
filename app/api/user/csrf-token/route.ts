import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateCsrfToken } from '@/lib/auth/csrf';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = await generateCsrfToken(user.id);
  return NextResponse.json({ token });
}
