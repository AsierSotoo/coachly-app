'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{ backgroundColor: '#020617' }}>
      <div className="text-center max-w-sm">
        <span className="material-symbols-outlined block mb-4" style={{ color: '#f87171', fontSize: 52 }}>
          error
        </span>
        <h1 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
          Algo salió mal
        </h1>
        <p className="text-sm mb-8" style={{ color: '#89968e' }}>
          {error.message || 'Error inesperado. Inténtalo de nuevo.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          <span className="material-symbols-outlined">refresh</span>
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
