import * as Sentry from '@sentry/browser';

const SENTRY_DSN = 'your-sentry-dsn'; // Substitua com seu DSN real

export const initSentry = () => {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.1, // Reduz para 10% das transações
    maxBreadcrumbs: 50,
    beforeSend(event) {
      // Não envia eventos em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        return null;
      }
      return event;
    },
    // Adiciona limitação de taxa
    transport: Sentry.makeBrowserTransport({
      // Implementa backoff exponencial
      retryAfter: (attempt) => Math.min(1000 * Math.pow(2, attempt), 60000),
      maxRetries: 3
    })
  });
};