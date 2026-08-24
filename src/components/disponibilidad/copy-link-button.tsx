'use client'

import { useState } from 'react'

export function CopyLinkButton({ url, className }: { url: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ url, title: 'Confirma tu disponibilidad' })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // user cancelled share or clipboard unavailable
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition-all active:scale-95 ${className ?? ''}`}
      style={{
        backgroundColor: copied ? 'rgba(75,226,119,0.15)' : '#1e293b',
        color: copied ? '#4be277' : '#adb4ce',
        border: `1px solid ${copied ? 'rgba(75,226,119,0.3)' : '#2e3447'}`,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
        {copied ? 'check' : 'share'}
      </span>
      {copied ? 'Copiado' : 'Compartir'}
    </button>
  )
}
