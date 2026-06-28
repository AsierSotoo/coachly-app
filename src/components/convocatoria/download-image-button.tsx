'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'

export function DownloadImageButton({ targetClass, filename }: { targetClass: string; filename: string }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const { toPng } = await import('html-to-image')
      const node = document.querySelector(`.${targetClass}`) as HTMLElement
      if (!node) { toast.error('No se encontró el contenido a exportar'); return }

      // Mostrar el nodo temporalmente para capturarlo
      const prevDisplay = node.style.display
      node.style.display = 'block'

      const dataUrl = await toPng(node, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: { fontFamily: 'system-ui, sans-serif', borderRadius: '0' },
      })

      node.style.display = prevDisplay

      const link = document.createElement('a')
      link.download = `${filename}.png`
      link.href = dataUrl
      link.click()
      toast.success('Imagen descargada')
    } catch {
      toast.error('Error al generar la imagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold border active:scale-95 transition-all cursor-pointer disabled:opacity-60"
      style={{ backgroundColor: '#23293c', borderColor: '#2e3447', color: '#dce1fb' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
        {loading ? 'hourglass_empty' : 'image'}
      </span>
      {loading ? 'Generando…' : 'Descargar PNG'}
    </button>
  )
}
