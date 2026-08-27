'use client'

import { useState } from 'react'
import { FORMATIONS, getFormation } from '@/lib/formations'

interface Player {
  id: string
  name: string
  number: number | null
}

interface Props {
  players: Player[]
  defaultFormation?: string | null
  defaultPositions?: Record<string, string>
}

export function FormationEditor({ players, defaultFormation, defaultPositions = {} }: Props) {
  const [formation, setFormation] = useState<string>(defaultFormation ?? '')
  const [positions, setPositions] = useState<Record<string, string>>(defaultPositions)

  const formationDef = formation ? getFormation(formation) : null

  function selectFormation(id: string) {
    if (id === formation) {
      setFormation('')
      setPositions({})
    } else {
      setFormation(id)
      setPositions({})
    }
  }

  function setPos(slotId: string, playerId: string) {
    setPositions(prev => {
      const next = { ...prev }
      // Si la jugadora ya estaba asignada en otro slot, la liberamos
      for (const k of Object.keys(next)) {
        if (next[k] === playerId && k !== slotId) delete next[k]
      }
      if (playerId) next[slotId] = playerId
      else delete next[slotId]
      return next
    })
  }

  // Mapa inverso: playerId → slotId (para deshabilitar en otros slots)
  const assignedSlots = new Map(
    Object.entries(positions)
      .filter(([, v]) => v)
      .map(([k, v]) => [v, k])
  )

  const assigned = Object.values(positions).filter(Boolean).length
  const total = formationDef ? formationDef.lines.flat().length : 0

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      {/* Inputs ocultos para el form */}
      <input type="hidden" name="formation" value={formation} />
      {formationDef && formationDef.lines.flat().map(slot => (
        <input
          key={slot.id}
          type="hidden"
          name={`pos_${slot.id}`}
          value={positions[slot.id] ?? ''}
        />
      ))}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 16 }}>sports</span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Táctica{' '}
            <span className="normal-case font-normal tracking-normal" style={{ color: '#334155' }}>(opcional)</span>
          </h2>
        </div>
        {formationDef && (
          <span className="text-[10px] font-bold tabular-nums" style={{ color: assigned === total ? '#4be277' : '#475569' }}>
            {assigned}/{total}
          </span>
        )}
      </div>

      {/* Chips de formación */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FORMATIONS.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => selectFormation(f.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95"
            style={{
              backgroundColor: formation === f.id ? 'rgba(75,226,119,0.1)' : 'transparent',
              borderColor: formation === f.id ? 'rgba(75,226,119,0.4)' : '#2e3447',
              color: formation === f.id ? '#4be277' : '#64748b',
            }}
          >
            {f.id}
          </button>
        ))}
      </div>

      {/* Cuadrícula de posiciones */}
      {formationDef && (
        <div className="flex flex-col gap-2.5">
          {formationDef.lines.map((line, lineIdx) => (
            <div key={lineIdx} className="flex gap-1.5">
              {line.map(slot => {
                const pid = positions[slot.id] ?? ''
                const assigned = !!pid

                return (
                  <div key={slot.id} className="flex-1 min-w-0 flex flex-col gap-1">
                    {/* Etiqueta de posición */}
                    <span
                      className="text-[9px] font-bold text-center uppercase tracking-wider"
                      style={{ color: assigned ? '#4be277' : '#334155' }}
                    >
                      {slot.label}
                    </span>
                    {/* Select de jugadora */}
                    <select
                      value={pid}
                      onChange={e => setPos(slot.id, e.target.value)}
                      className="w-full rounded-lg border px-1 text-[10px] font-semibold text-center focus:outline-none transition-colors"
                      style={{
                        height: 32,
                        backgroundColor: assigned ? 'rgba(75,226,119,0.07)' : '#151b2d',
                        borderColor: assigned ? 'rgba(75,226,119,0.25)' : '#2e3447',
                        color: assigned ? '#dce1fb' : '#475569',
                        appearance: 'none',
                      }}
                    >
                      <option value="">—</option>
                      {players.map(p => {
                        const isElsewhere = assignedSlots.has(p.id) && assignedSlots.get(p.id) !== slot.id
                        return (
                          <option key={p.id} value={p.id} disabled={isElsewhere}>
                            {p.number != null ? `#${p.number} ` : ''}{p.name.split(' ')[0]}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )
              })}
            </div>
          ))}

          {/* Ayuda */}
          <p className="text-[10px] mt-1" style={{ color: '#1e293b' }}>
            Cada jugadora solo puede ocupar una posición
          </p>
        </div>
      )}
    </section>
  )
}
