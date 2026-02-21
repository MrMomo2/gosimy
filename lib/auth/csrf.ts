import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

const CSRF_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

export async function generateCsrfToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + CSRF_TOKEN_EXPIRY_MS).toISOString();

  const supabase = createSupabaseAdminClient();
  await supabase
    .from('session_tokens')
    .insert({
      user_id: userId,
      token,
      token_type: 'csrf',
      expires_at: expiresAt,
    });

  return token;
}

export async function validateCsrfToken(userId: string, token: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  
  const { data } = await supabase
    .from('session_tokens')
    .select('id')
    .eq('user_id', userId)
    .eq('token', token)
    .eq('token_type', 'csrf')
    .gte('expires_at', new Date().toISOString())
    .single();

  if (data) {
    await supabase
      .from('session_tokens')
      .delete()
      .eq('id', data.id);
    return true;
  }

  return false;
}
