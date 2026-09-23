import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,      // 20% de trazas de rendimiento
  replaysOnErrorSampleRate: 1, // reproducción completa en errores
  replaysSessionSampleRate: 0, // sin replay en sesiones normales
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: false,
    }),
  ],
  enabled: process.env.NODE_ENV === 'production',
})
