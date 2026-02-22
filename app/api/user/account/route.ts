import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { validateCsrfToken } from '@/lib/auth/csrf';
import { z } from 'zod';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().email(),
  csrfToken: z.string().length(64),
});

export async function DELETE(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parse = schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { email, csrfToken } = parse.data;

  const tokenValid = await validateCsrfToken(user.id, csrfToken);
  if (!tokenValid) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 });
  }

  if (email !== user.email) {
    return NextResponse.json({ error: 'Email does not match' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Block deletion if orders are actively processing
  const { count: activeCount } = await admin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['paid', 'fulfilling']);

  if (activeCount && activeCount > 0) {
    return NextResponse.json(
      { error: 'You have orders currently being processed. Please wait for fulfillment to complete.' },
      { status: 409 }
    );
  }

  // Anonymise user references (preserve financial records)
  await admin.from('orders').update({ user_id: null }).eq('user_id', user.id);
  await admin.from('esims').update({ user_id: null }).eq('user_id', user.id);

  // Hard-delete auth-specific rows
  await admin.from('user_roles').delete().eq('user_id', user.id);
  await admin.from('session_tokens').delete().eq('user_id', user.id);

  // Delete from Supabase Auth
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('[delete-account] Failed to delete auth user:', deleteError.message);
    return NextResponse.json({ error: 'Account deletion failed. Please contact support.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
