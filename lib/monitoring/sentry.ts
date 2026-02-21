import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.log('[Sentry] DSN not set, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    integrations: [
      Sentry.extraErrorDataIntegration(),
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn'],
      }),
    ],
    
    ignoreErrors: [
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      'Non-Error promise rejection captured',
      'ResizeObserver loop',
      'cancelled',
    ],
  });
  
  console.log('[Sentry] Initialized');
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  if (!SENTRY_DSN) {
    console.error('[Error]', error, context);
    return;
  }
  
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!SENTRY_DSN) {
    console.log(`[${level.toUpperCase()}]`, message);
    return;
  }
  
  Sentry.captureMessage(message, level);
}

export function setUserId(userId: string | null) {
  if (!SENTRY_DSN) return;
  
  if (userId) {
    Sentry.setUser({ id: userId });
  } else {
    Sentry.setUser(null);
  }
}

export function addBreadcrumb(category: string, message: string, data?: Record<string, unknown>) {
  if (!SENTRY_DSN) {
    console.log(`[Breadcrumb] ${category}: ${message}`, data);
    return;
  }
  
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
}

export { Sentry };
