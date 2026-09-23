import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://c2765f153bf84fa8dd6ed66fe8342ce8@o4512131041460224.ingest.de.sentry.io/4512131043688528',
  tracesSampleRate: 0.2,
  debug: true,
})
