'use client'

import { useState } from 'react'
import { FORMATIONS, getFormation } from '@/lib/formations'

interface Player {
  id: string
  name: string
  number: number | null
  position: string | null
}

interface Props {
  players: Player[]
  defaultFormation?: string | null
  defaultPositions?: Record<string, string>
}

// Categoría táctica de cada slot
function slotCategory(slotId: string): 'port' | 'def' | 'mid' | 'fwd' {
  if (slotId === 'PO') return 'port'
  if (slotId === 'LD' || slotId === 'LI' || slotId.startsWith('DFC')) return 'def'
  if (slotId.startsWith('DC') || slotId === 'ED' || slotId === 'EI') return 'fwd'
  return 'mid' // MC, MCD, MCO, MD, MI y variantes
}

// Comprueba si la posición de la jugadora encaja con la categoría del slot
function matchesSlot(position: string | null, slotId: string): boolean {
  const p = (position ?? '').toLowerCase()
  const cat = slotCategory(slotId)
  if (cat === 'port') return p.includes('port')
  if (cat === 'def')  return p.includes('def') || p.includes('later') || p.includes('central') || p.includes('stopp')
  if (cat === 'mid')  return p.includes('cent') || p.includes('medio') || p.includes('campist') || p.includes('mid') || p.includes('pivot') || p.includes('volant')
  if (cat === 'fwd')  return p.includes('del') || p.includes('ext') || p.includes('punta') || p.includes('atac') || p.includes('winger')
  return false
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
      for (const k of Object.keys(next)) {
        if (next[k] === playerId && k !== slotId) delete next[k]
      }
      if (playerId) next[slotId] = playerId
      else delete next[slotId]
      return next
    })
  }

  // Mapa inverso: playerId → slotId
  const assignedSlots = new Map(
    Object.entries(positions).filter(([, v]) => v).map(([k, v]) => [v, k])
  )

  const assigned = Object.values(positions).filter(Boolean).length
  const total = formationDef ? formationDef.lines.flat().length : 0

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      {/* Inputs ocultos para el form */}
      <input type="hidden" name="formation" value={formation} />
      {formationDef && formationDef.lines.flat().map(slot => (
        <input key={slot.id} type="hidden" name={`pos_${slot.id}`} value={positions[slot.id] ?? ''} />
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
          <span className="text-[10px] font-bold tabular-nums" style={{ color: assigned === total ? '#72e697' : '#637168' }}>
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
              borderColor: formation === f.id ? 'rgba(75,226,119,0.4)' : '#2a342d',
              color: formation === f.id ? '#72e697' : '#637168',
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
                const isAssigned = !!pid
                const suggested = players.filter(p => matchesSlot(p.position, slot.id))
                const others    = players.filter(p => !matchesSlot(p.position, slot.id))
                const hasBothGroups = suggested.length > 0 && others.length > 0

                return (
                  <div key={slot.id} className="flex-1 min-w-0 flex flex-col gap-1">
                    <span
                      className="text-[9px] font-bold text-center uppercase tracking-wider"
                      style={{ color: isAssigned ? '#72e697' : '#334155' }}
                    >
                      {slot.label}
                    </span>
                    <select
                      value={pid}
                      onChange={e => setPos(slot.id, e.target.value)}
                      className="w-full rounded-lg border px-1 text-[10px] font-semibold text-center focus:outline-none transition-colors"
                      style={{
                        height: 32,
                        backgroundColor: isAssigned ? 'rgba(75,226,119,0.07)' : '#111713',
                        borderColor: isAssigned ? 'rgba(75,226,119,0.25)' : '#2a342d',
                        color: isAssigned ? '#edf2ee' : '#637168',
                        appearance: 'none',
                      }}
                    >
                      <option value="">—</option>
                      {hasBothGroups ? (
                        <>
                          <optgroup label="Sugeridas">
                            {suggested.map(p => <PlayerOption key={p.id} p={p} slotId={slot.id} assignedSlots={assignedSlots} />)}
                          </optgroup>
                          <optgroup label="Otras">
                            {others.map(p => <PlayerOption key={p.id} p={p} slotId={slot.id} assignedSlots={assignedSlots} />)}
                          </optgroup>
                        </>
                      ) : (
                        players.map(p => <PlayerOption key={p.id} p={p} slotId={slot.id} assignedSlots={assignedSlots} />)
                      )}
                    </select>
                  </div>
                )
              })}
            </div>
          ))}

          <p className="text-[10px] mt-1" style={{ color: '#253028' }}>
            Cada jugadora solo puede ocupar una posición
          </p>
        </div>
      )}
    </section>
  )
}

function PlayerOption({
  p, slotId, assignedSlots,
}: {
  p: Player
  slotId: string
  assignedSlots: Map<string, string>
}) {
  const isElsewhere = assignedSlots.has(p.id) && assignedSlots.get(p.id) !== slotId
  const label = `${p.number != null ? `#${p.number} ` : ''}${p.name.split(' ')[0]}`
  return (
    <option value={p.id} disabled={isElsewhere}>
      {isElsewhere ? `↳ ${label}` : label}
    </option>
  )
}
