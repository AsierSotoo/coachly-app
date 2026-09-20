'use client'

import { useEffect, useState } from 'react'
import { CHANGELOG, CURRENT_VERSION } from '@/lib/changelog'

const LS_KEY = 'coachly_seen_version'

export function WhatsNewModal() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    const seen = localStorage.getItem(LS_KEY)
    if (seen !== CURRENT_VERSION) setOpen(true)
  }, [])

  function dismiss() {
    localStorage.setItem(LS_KEY, CURRENT_VERSION)
    setOpen(false)
  }

  function toggle(i: number) {
    setExpanded(prev => (prev === i ? null : i))
  }

  if (!open) return null

  const entry = CHANGELOG[0]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={dismiss}
    >
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#111713', borderColor: '#2a342d' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#72e697', border: '1px solid rgba(34,197,94,0.3)' }}>
                {entry.version}
              </span>
              <span className="text-[11px]" style={{ color: '#637168' }}>{entry.date}</span>
            </div>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              Novedades en Coachly
            </h2>
          </div>
          <button
            onClick={dismiss}
            className="flex items-center justify-center w-8 h-8 rounded-full border transition-colors cursor-pointer flex-shrink-0"
            style={{ borderColor: '#2a342d', color: '#637168' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
          </button>
        </div>

        {/* Lista de cambios */}
        <ul className="flex flex-col px-6 pb-4 gap-1 max-h-[60vh] overflow-y-auto">
          {entry.changes.map((c, i) => (
            <li key={i} className="rounded-xl overflow-hidden" style={{ backgroundColor: expanded === i ? '#1e2740' : 'transparent' }}>
              <button
                className="w-full flex items-center gap-3 py-3 px-3 text-left transition-colors cursor-pointer rounded-xl hover:bg-[#1e2740]"
                onClick={() => c.detail && toggle(i)}
                style={{ cursor: c.detail ? 'pointer' : 'default' }}
              >
                <span
                  className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg"
                  style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#72e697' }}>{c.icon}</span>
                </span>
                <p className="text-sm flex-1 leading-snug" style={{ color: '#edf2ee' }}>{c.text}</p>
                {c.detail && (
                  <span
                    className="material-symbols-outlined flex-shrink-0 transition-transform duration-200"
                    style={{ fontSize: 16, color: '#637168', transform: expanded === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    expand_more
                  </span>
                )}
              </button>
              {c.detail && expanded === i && (
                <p className="px-3 pb-3 pt-0 text-xs leading-relaxed ml-11" style={{ color: '#637168' }}>
                  {c.detail}
                </p>
              )}
            </li>
          ))}
        </ul>

        {/* Botón */}
        <div className="px-6 pb-6">
          <button
            onClick={dismiss}
            className="w-full h-11 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
            style={{ backgroundColor: '#72e697', color: '#07140c', fontFamily: 'Sora, sans-serif' }}
          >
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  )
}
