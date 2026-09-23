import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? 'https://c2765f153bf84fa8dd6ed66fe8342ce8@o4512131041460224.ingest.de.sentry.io/4512131043688528',
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
