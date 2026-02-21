import { createSupabaseAdminClient } from '@/lib/supabase/server';

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  checkout: { max: 10, windowMs: 60 * 60 * 1000 },
  checkoutGuest: { max: 5, windowMs: 60 * 60 * 1000 },
  couponValidate: { max: 10, windowMs: 60 * 1000 },
  esimQuery: { max: 30, windowMs: 60 * 1000 },
  packages: { max: 60, windowMs: 60 * 1000 },
};

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function checkRateLimit(
  key: string,
  identifier: string,
  limitType: keyof typeof RATE_LIMITS
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[limitType];
  const windowStart = new Date(Date.now() - config.windowMs).toISOString();
  
  const supabase = createSupabaseAdminClient();
  
  const { count, error } = await supabase
    .from('rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('key', key)
    .eq('identifier', identifier)
    .gte('created_at', windowStart);

  if (error) {
    console.error('[rate-limit] Error checking rate limit:', error.message);
    return { allowed: false, remaining: 0, resetAt: new Date(Date.now() + config.windowMs) };
  }

  const current = count ?? 0;
  const allowed = current < config.max;
  const remaining = Math.max(0, config.max - current - 1);
  const resetAt = new Date(Date.now() + config.windowMs);

  if (allowed) {
    await supabase
      .from('rate_limits')
      .insert({ key, identifier });
  }

  return { allowed, remaining, resetAt };
}

export async function checkIpRateLimit(
  ip: string,
  limitType: keyof typeof RATE_LIMITS
): Promise<RateLimitResult> {
  return checkRateLimit(`ip:${ip}`, ip, limitType);
}

export async function checkUserRateLimit(
  userId: string,
  limitType: keyof typeof RATE_LIMITS
): Promise<RateLimitResult> {
  return checkRateLimit(`user:${userId}`, userId, limitType);
}
