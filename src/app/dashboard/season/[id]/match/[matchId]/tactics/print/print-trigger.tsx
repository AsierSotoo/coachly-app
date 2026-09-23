'use client'

import { useEffect } from 'react'

export function PrintTrigger() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
      style={{ backgroundColor: '#111', color: '#fff' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
      Imprimir
    </button>
  )
}
