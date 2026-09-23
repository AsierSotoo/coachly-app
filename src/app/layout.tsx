import type { Metadata, Viewport } from 'next'
import { Sora, Geist } from 'next/font/google'
import Script from 'next/script'
import { Toaster } from 'sonner'
import { InstallPrompt } from '@/components/ui/install-prompt'
import { ThemeProvider } from '@/components/ui/theme-provider'
import './globals.css'

const sora = Sora({ subsets: ['latin'], variable: '--font-heading', weight: ['400','600','700','800'] })
const geist = Geist({ subsets: ['latin'], variable: '--font-body', weight: ['400','600'] })

export const metadata: Metadata = {
  title: { default: 'Coachly', template: '%s · Coachly' },
  description: 'Planifica partidos, prepara convocatorias y sigue la evolución de tu equipo.',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Coachly' },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#090e0b',
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
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('coachly-theme');if(t)document.documentElement.setAttribute('data-theme',t);})()` }} />
      </head>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-heading)] antialiased" style={{ color: 'var(--tx)' }}>
        <ThemeProvider>
        {children}
        <InstallPrompt />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: { background: 'var(--bg-card)', border: '1px solid var(--bdr-strong)', color: 'var(--tx)' },
          }}
        />
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
          }
        `}</Script>
        </ThemeProvider>
      </body>
    </html>
  )
}
