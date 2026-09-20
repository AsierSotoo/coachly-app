'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Ya instalada → no mostrar
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Usuario ya descartó el banner
    try { if (localStorage.getItem('pwa-dismissed')) return } catch {}

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
    setIsIOS(ios)

    if (ios) {
      // En iOS mostrar el banner directamente (no hay evento beforeinstallprompt)
      setShow(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') dismiss()
  }

  function dismiss() {
    try { localStorage.setItem('pwa-dismissed', '1') } catch {}
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      className="fixed left-4 right-4 z-50 rounded-2xl border p-3.5 flex items-center gap-3"
      style={{
        bottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 8px)',
        backgroundColor: '#111713',
        borderColor: '#2a342d',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Icono */}
      <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: 'var(--accent)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="Coachly" className="w-full h-full object-cover" />
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-tight" style={{ color: '#edf2ee' }}>
          Instalar Coachly
        </p>
        <p className="text-xs mt-0.5 leading-tight" style={{ color: '#637168' }}>
          {isIOS
            ? 'Toca Compartir → "Añadir a pantalla de inicio"'
            : 'Accede más rápido desde tu pantalla de inicio'}
        </p>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            Instalar
          </button>
        )}
        <button
          onClick={dismiss}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-[#253028]"
          style={{ color: '#637168' }}
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>
      </div>
    </div>
  )
}
