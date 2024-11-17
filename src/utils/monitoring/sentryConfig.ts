import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = 'your-sentry-dsn'; // Replace with your actual DSN

export const initSentry = () => {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.1, // Reduce to 10% of transactions
    maxBreadcrumbs: 50,
    beforeSend(event) {
      // Don't send events in development
      if (process.env.NODE_ENV === 'development') {
        return null;
      }
      return event;
    },
    // Add rate limiting
    transport: Sentry.makeBrowserTransport({
      // Implement exponential backoff
      retryAfter: (attempt) => Math.min(1000 * Math.pow(2, attempt), 60000),
      maxRetries: 3
    })
  });
};