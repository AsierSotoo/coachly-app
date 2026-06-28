import type { Metadata, Viewport } from 'next'
import { Sora, Geist } from 'next/font/google'
import Script from 'next/script'
import { Toaster } from 'sonner'
import './globals.css'

const sora = Sora({ subsets: ['latin'], variable: '--font-heading', weight: ['400','600','700','800'] })
const geist = Geist({ subsets: ['latin'], variable: '--font-body', weight: ['400','600'] })

export const metadata: Metadata = {
  title: { default: 'Coachly', template: '%s · Coachly' },
  description: 'Las estadísticas de tu equipo de fútbol, en un sitio. Goleadoras, minutos, tarjetas y más.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Coachly' },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sora.variable} ${geist.variable} h-full`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className="min-h-full flex flex-col text-slate-50 font-[family-name:var(--font-body)] antialiased">
        {children}
        <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{
            style: { background: '#1e293b', border: '1px solid #334155', color: '#f8fafc' },
          }}
        />
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
          }
        `}</Script>
      </body>
    </html>
  )
}
