import type { Metadata, Viewport } from 'next'
import { Fira_Code, Fira_Sans } from 'next/font/google'
import Script from 'next/script'
import { Toaster } from 'sonner'
import './globals.css'

const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-heading', weight: ['400','500','600','700'] })
const firaSans = Fira_Sans({ subsets: ['latin'], variable: '--font-body', weight: ['300','400','500','600','700'] })

export const metadata: Metadata = {
  title: 'Coachly',
  description: 'Las estadísticas de tu equipo, en un sitio.',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Coachly' },
}

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${firaCode.variable} ${firaSans.variable} h-full`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
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
