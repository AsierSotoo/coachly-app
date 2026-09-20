'use client'

import { useState } from 'react'
import { toPng } from 'html-to-image'

export function DownloadImageButton({ targetId, filename }: { targetId: string; filename: string }) {
  const [loading, setLoading] = useState(false)

  async function handleShare() {
    const el = document.getElementById(targetId)
    if (!el) return
    setLoading(true)
    try {
      const dataUrl = await toPng(el, {
        pixelRatio: 2,
        backgroundColor: '#111713',
        style: { borderRadius: '0' },
      })
      const fname = `${filename}.png`
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], fname, { type: 'image/png' })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: filename, files: [file] })
      } else {
        const link = document.createElement('a')
        link.download = fname
        link.href = dataUrl
        link.click()
      }
    } catch {
      alert('No se pudo generar la imagen. Prueba a hacer una captura de pantalla.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95 cursor-pointer disabled:opacity-50"
      style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: 'var(--accent)' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
        {loading ? 'hourglass_empty' : 'share'}
      </span>
      {loading ? 'Generando…' : 'Compartir imagen'}
    </button>
  )
}
