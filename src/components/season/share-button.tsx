'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export function ShareButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    const url = `${base}/share/${token}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Enlace copiado', { description: 'Compártelo con quien quieras — no hace falta login.' })
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-all active:scale-95 cursor-pointer"
      style={{
        backgroundColor: copied ? 'rgba(34,197,94,0.15)' : '#191f31',
        borderColor: copied ? 'rgba(34,197,94,0.4)' : '#2e3447',
        color: copied ? '#4be277' : '#dce1fb',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
        {copied ? 'check' : 'share'}
      </span>
      {copied ? 'Copiado' : 'Compartir'}
    </button>
  )
}
