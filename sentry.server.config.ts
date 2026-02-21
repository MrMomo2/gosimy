import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    integrations: [
      Sentry.extraErrorDataIntegration(),
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn'],
      }),
    ],
    
    ignoreErrors: [
      'NetworkError',
      'Failed to fetch',
      'ECONNREFUSED',
      'ETIMEDOUT',
    ],
  });
}
