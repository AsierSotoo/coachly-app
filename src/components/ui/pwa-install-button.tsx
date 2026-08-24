'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallButton({ compact = false }: { compact?: boolean }) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    function onPrompt(e: Event) {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    function onInstalled() {
      setPrompt(null)
      setIsStandalone(true)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setPrompt(null)
      setIsStandalone(true)
    }
  }

  if (isStandalone || !prompt) return null

  if (compact) {
    return (
      <button
        onClick={install}
        className="flex items-center justify-center rounded-xl border border-green-500/30 transition-all active:scale-95"
        style={{ width: 40, height: 40, backgroundColor: 'rgba(34,197,94,0.08)', color: '#4be277' }}
        title="Instalar Coachly en tu teléfono"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>install_mobile</span>
      </button>
    )
  }

  return (
    <button
      onClick={install}
      className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border border-green-500/20 transition-all active:scale-95 hover:border-green-500/40"
      style={{ backgroundColor: 'rgba(34,197,94,0.06)', color: '#4be277' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>install_mobile</span>
      <div className="text-left">
        <p className="text-[11px] font-bold">Instalar Coachly</p>
        <p className="text-[9px] opacity-70">Añadir a pantalla de inicio</p>
      </div>
    </button>
  )
}
