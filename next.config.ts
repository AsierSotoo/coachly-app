import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,              // sin spam en build logs
  disableLogger: true,
  automaticVercelMonitors: false,
  // Solo sube source maps si hay DSN configurado
  sourcemaps: { disable: !process.env.NEXT_PUBLIC_SENTRY_DSN },
})
