'use client'

import { useTransition, useState } from 'react'
import { setPlayerAvailability } from '@/lib/availability-actions'
import { PlayerAvatar } from '@/components/team/player-avatar'

type Status = 'available' | 'unavailable' | 'doubt' | null

interface Player {
  id: string
  name: string
  number: number | null
  position: string | null
  photo_url?: string | null
}

interface Props {
  matchId: string
  seasonId: string
  players: Player[]
  initialAvailability: Record<string, Status>
}

const BUTTONS: { status: 'available' | 'doubt' | 'unavailable'; label: string; icon: string; color: string; bg: string; border: string }[] = [
  { status: 'available',   label: 'Disponible',    icon: 'check', color: '#72e697', bg: 'rgba(75,226,119,0.15)',  border: 'rgba(75,226,119,0.35)'  },
  { status: 'doubt',       label: 'Duda',          icon: 'help',  color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.35)'  },
  { status: 'unavailable', label: 'No disponible', icon: 'close', color: '#f87171', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.35)' },
]

export function AvailabilityPicker({ matchId, seasonId, players, initialAvailability }: Props) {
  const [, startTransition] = useTransition()
  const [avail, setAvail] = useState<Record<string, Status>>({ ...initialAvailability })

  function toggle(playerId: string, status: 'available' | 'doubt' | 'unavailable') {
    const next: Status = avail[playerId] === status ? null : status
    setAvail(prev => ({ ...prev, [playerId]: next }))
    startTransition(() => { setPlayerAvailability(matchId, playerId, next, seasonId) })
  }

  const available   = players.filter(p => avail[p.id] === 'available')
  const doubt       = players.filter(p => avail[p.id] === 'doubt')
  const unavailable = players.filter(p => avail[p.id] === 'unavailable')
  const unset       = players.filter(p => !avail[p.id])

  return (
    <section className="rounded-2xl border overflow-hidden"
      style={{ borderColor: 'var(--bdr-strong)', backgroundColor: 'var(--bg-card)' }}>

      {/* Cabecera */}
      <div className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: 'var(--bdr-strong)', backgroundColor: 'var(--bg-card-2)' }}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent)' }}>how_to_reg</span>
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--tx-3)' }}>Disponibilidad</h2>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold">
          {available.length > 0 && (
            <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(75,226,119,0.1)', color: '#72e697' }}>
              ✓ {available.length}
            </span>
          )}
          {doubt.length > 0 && (
            <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
              ? {doubt.length}
            </span>
          )}
          {unavailable.length > 0 && (
            <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
              ✗ {unavailable.length}
            </span>
          )}
          {unset.length > 0 && (
            <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--tx-4)' }}>
              {unset.length} sin marcar
            </span>
          )}
        </div>
      </div>

      {/* Lista de jugadoras */}
      <div>
        {players.map((player, i) => {
          const current = avail[player.id]
          return (
            <div key={player.id}
              className="flex items-center gap-3 px-4 py-2.5"
              style={{ borderBottom: i < players.length - 1 ? '1px solid var(--bdr)' : 'none' }}>
              <PlayerAvatar name={player.name} photoUrl={player.photo_url} position={player.position} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--tx)' }}>{player.name}</p>
                {player.position && <p className="text-[10px]" style={{ color: 'var(--tx-4)' }}>{player.position}</p>}
              </div>
              <div className="flex rounded-xl overflow-hidden flex-shrink-0"
                style={{ border: '1px solid var(--bdr)' }}>
                {BUTTONS.map(btn => {
                  const active = current === btn.status
                  return (
                    <button
                      key={btn.status}
                      type="button"
                      title={btn.label}
                      onClick={() => toggle(player.id, btn.status)}
                      className="flex h-9 w-10 items-center justify-center transition-all cursor-pointer"
                      style={active
                        ? { backgroundColor: btn.bg, borderLeft: `1px solid ${btn.border}`, color: btn.color }
                        : { backgroundColor: 'transparent', color: 'var(--tx-4)' }
                      }
                    >
                      <span className="material-symbols-outlined"
                        style={{ fontSize: 16, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                        {btn.icon}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
