import { initSentry } from '@/lib/monitoring/sentry';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    initSentry();
  }
}
