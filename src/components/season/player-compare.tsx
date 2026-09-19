'use client'

import { useState } from 'react'
import { PlayerAvatar } from '@/components/team/player-avatar'

export type CompareStat = {
  playerId: string
  name: string
  photoUrl?: string | null
  position?: string | null
  goals: number
  assists: number
  minutes: number
  yellowCards: number
  redCards: number
  gamesPlayed: number
}

const ROWS: { label: string; key: keyof CompareStat; fmt?: (v: number) => string; better: 'higher' | 'lower' }[] = [
  { label: 'Partidos jugados', key: 'gamesPlayed', better: 'higher' },
  { label: 'Goles',            key: 'goals',       better: 'higher' },
  { label: 'Asistencias',      key: 'assists',     better: 'higher' },
  { label: 'G + A',            key: 'goals',       better: 'higher' }, // valor calculado en getValue
  { label: 'Minutos',          key: 'minutes',     fmt: (v) => v.toLocaleString('es-ES'), better: 'higher' },
  { label: 'Tarjetas amarillas', key: 'yellowCards', better: 'lower' },
  { label: 'Tarjetas rojas',   key: 'redCards',    better: 'lower' },
]

function shortName(name: string) {
  const parts = name.trim().split(' ')
  return parts.length <= 1 ? name : `${parts[0][0]}. ${parts.slice(1).join(' ')}`
}

export function PlayerCompare({ players }: { players: CompareStat[] }) {
  const [aId, setAId] = useState<string>('')
  const [bId, setBId] = useState<string>('')

  const a = players.find(p => p.playerId === aId) ?? null
  const b = players.find(p => p.playerId === bId) ?? null

  function getValue(p: CompareStat | null, row: typeof ROWS[number]): number {
    if (!p) return 0
    if (row.label === 'G + A') return p.goals + p.assists
    return p[row.key] as number
  }

  const formatVal = (row: typeof ROWS[number], val: number): string => {
    if (row.label === 'Minutos') return val.toLocaleString('es-ES')
    return String(val)
  }

  return (
    <div>
      {/* Selectores */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {([{ id: aId, set: setAId, label: 'Jugadora A', exclude: bId },
           { id: bId, set: setBId, label: 'Jugadora B', exclude: aId }] as const).map(({ id, set, label, exclude }) => (
          <div key={label} className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#89968e' }}>{label}</label>
            <select
              value={id}
              onChange={e => set(e.target.value)}
              className="border rounded-xl px-4 py-3 text-sm outline-none appearance-none"
              style={{ backgroundColor: '#090e0b', borderColor: '#2a342d', color: '#edf2ee' }}
            >
              <option value="">— Elige jugadora —</option>
              {players
                .filter(p => p.playerId !== exclude)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(p => (
                  <option key={p.playerId} value={p.playerId}>{p.name}</option>
                ))}
            </select>
          </div>
        ))}
      </div>

      {/* Cabecera con avatares */}
      {(a || b) && (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-4">
          <div className="flex flex-col items-center gap-1">
            {a
              ? <>
                  <PlayerAvatar name={a.name} photoUrl={a.photoUrl} position={a.position} size="lg" className="h-14 w-14" />
                  <p className="text-sm font-bold text-white text-center">{shortName(a.name)}</p>
                  <p className="text-[10px]" style={{ color: '#89968e' }}>{a.position ?? '—'}</p>
                </>
              : <div className="h-14 w-14 rounded-full border-2 border-dashed border-[#2a342d]" />
            }
          </div>
          <span className="text-lg font-black" style={{ color: '#2a342d' }}>VS</span>
          <div className="flex flex-col items-center gap-1">
            {b
              ? <>
                  <PlayerAvatar name={b.name} photoUrl={b.photoUrl} position={b.position} size="lg" className="h-14 w-14" />
                  <p className="text-sm font-bold text-white text-center">{shortName(b.name)}</p>
                  <p className="text-[10px]" style={{ color: '#89968e' }}>{b.position ?? '—'}</p>
                </>
              : <div className="h-14 w-14 rounded-full border-2 border-dashed border-[#2a342d]" />
            }
          </div>
        </div>
      )}

      {/* Tabla comparativa */}
      {a && b && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#253028' }}>
          {ROWS.map((row, i) => {
            const va = getValue(a, row)
            const vb = getValue(b, row)
            const aWins = row.better === 'higher' ? va > vb : va < vb
            const bWins = row.better === 'higher' ? vb > va : vb < va
            return (
              <div key={i}
                className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 border-b last:border-0"
                style={{ borderColor: '#253028', backgroundColor: i % 2 === 0 ? '#0b100d' : '#090e0b' }}>
                <span className="text-sm font-bold tabular-nums text-right"
                  style={{ color: aWins ? '#72e697' : '#edf2ee' }}>
                  {formatVal(row, va)}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wide px-3 text-center"
                  style={{ color: '#637168', minWidth: 120 }}>
                  {row.label}
                </span>
                <span className="text-sm font-bold tabular-nums text-left"
                  style={{ color: bWins ? '#72e697' : '#edf2ee' }}>
                  {formatVal(row, vb)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {!a && !b && (
        <p className="text-center text-sm py-8" style={{ color: '#637168' }}>
          Selecciona dos jugadoras para comparar sus estadísticas
        </p>
      )}
    </div>
  )
}
