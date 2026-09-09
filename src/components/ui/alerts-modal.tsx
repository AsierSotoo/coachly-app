'use client'

import { useEffect, useState } from 'react'

interface Alert {
  playerId: string
  name: string
  count: number
}

function alertKey(alerts: Alert[]) {
  return alerts.map(a => `${a.playerId}:${a.count}`).sort().join('|')
}

export function AlertsModal({ alerts }: { alerts: Alert[] }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!alerts.length) return
    const stored = localStorage.getItem('coachly_yellow_alert')
    if (stored !== alertKey(alerts)) setOpen(true)
  }, [alerts])

  function dismiss() {
    localStorage.setItem('coachly_yellow_alert', alertKey(alerts))
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={dismiss}
    >
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#151b2d', borderColor: '#2e3447' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                style={{ backgroundColor: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.35)' }}
              >
                Cuidado
              </span>
            </div>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              Sanciones por acumulación
            </h2>
            <p className="text-sm mt-0.5" style={{ color: '#adb4ce' }}>
              {alerts.length === 1
                ? '1 jugadora con 4 o más amarillas'
                : `${alerts.length} jugadoras con 4 o más amarillas`}
            </p>
          </div>
          <button
            onClick={dismiss}
            className="flex items-center justify-center w-8 h-8 rounded-full border transition-colors hover:bg-slate-700 cursor-pointer flex-shrink-0"
            style={{ borderColor: '#2e3447', color: '#64748b' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
          </button>
        </div>

        {/* Lista de jugadoras */}
        <ul className="flex flex-col px-6 pb-4 gap-2 max-h-[50vh] overflow-y-auto">
          {alerts.map(a => (
            <li
              key={a.playerId}
              className="flex items-center gap-3 py-3 px-3 rounded-xl"
              style={{ backgroundColor: '#1e2740' }}
            >
              <span
                className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ backgroundColor: 'rgba(251,191,36,0.1)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#fbbf24' }}>
                  warning
                </span>
              </span>

              <p className="text-sm flex-1 font-semibold leading-tight" style={{ color: '#dce1fb' }}>
                {a.name}
              </p>

              {/* Tarjetas amarillas visuales */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {Array.from({ length: Math.min(a.count, 6) }).map((_, i) => (
                  <span
                    key={i}
                    className="inline-block rounded-[2px]"
                    style={{ width: 9, height: 13, backgroundColor: '#fbbf24' }}
                  />
                ))}
                {a.count > 6 && (
                  <span className="text-[10px] font-black" style={{ color: '#fbbf24' }}>+{a.count - 6}</span>
                )}
                <span className="ml-1.5 text-xs font-black tabular-nums" style={{ color: '#fbbf24' }}>
                  {a.count}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <p className="px-6 pb-4 text-xs leading-snug" style={{ color: '#475569' }}>
          En categoría autonómica, 4 amarillas acumuladas suponen 1 partido de sanción.
        </p>

        {/* Botón */}
        <div className="px-6 pb-6">
          <button
            onClick={dismiss}
            className="w-full h-11 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
            style={{
              backgroundColor: 'rgba(251,191,36,0.12)',
              color: '#fbbf24',
              border: '1px solid rgba(251,191,36,0.35)',
              fontFamily: 'Sora, sans-serif',
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
