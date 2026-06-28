'use client'

import { useState, useRef, useEffect } from 'react'
import { PlayerAvatar } from '@/components/team/player-avatar'

type Status = 'titular' | 'suplente' | 'no_convocada'

interface Player {
  id: string; name: string; number: number | null
  position: string | null; photo_url?: string | null
}

interface Appearance {
  starter: boolean; minutes: number; goals: number
  assists: number; yellow_cards: number; red_cards: number
}

interface Props {
  player: Player
  appearance?: Appearance
  convocatoriaStatus?: 'titular' | 'convocada' | 'no_convocada'
  isLast?: boolean
}

const POSITION_COLORS: Record<string, string> = {
  Portera: 'text-amber-400', Portero: 'text-amber-400',
  Defensa: 'text-blue-400',
  Centrocampista: 'text-green-400',
  Delantera: 'text-red-400', Delantero: 'text-red-400',
}

export function PlayerRowDesktop({ player, appearance, convocatoriaStatus, isLast }: Props) {
  const defaultStatus: Status = appearance
    ? (appearance.starter ? 'titular' : 'suplente')
    : convocatoriaStatus === 'titular'      ? 'titular'
    : convocatoriaStatus === 'no_convocada' ? 'no_convocada'
    : 'suplente' // 'convocada' o sin convocatoria → suplente por defecto

  const [status, setStatus] = useState<Status>(defaultStatus)
  const [minutes, setMinutes] = useState<number>(() => {
    if (appearance) return appearance.minutes
    return defaultStatus === 'titular' ? 90 : 0
  })

  const prevStatus = useRef<Status>(defaultStatus)
  useEffect(() => {
    if (!appearance) {
      if (status === 'titular' && prevStatus.current !== 'titular') setMinutes(90)
      else if (status !== 'titular' && prevStatus.current === 'titular') setMinutes(0)
    }
    prevStatus.current = status
  }, [status, appearance])

  const getDefault = (key: string) => {
    if (!appearance) return 0
    const map: Record<string, number> = { goals: appearance.goals, assists: appearance.assists, yellow: appearance.yellow_cards, red: appearance.red_cards }
    return map[key] ?? 0
  }

  const statusBtns: { s: Status; label: string; active: string; inactive: string }[] = [
    { s: 'titular',     label: 'T', active: 'bg-green-500 text-white',  inactive: 'text-slate-600 hover:bg-slate-800' },
    { s: 'suplente',    label: 'S', active: 'bg-slate-500 text-white',  inactive: 'text-slate-600 hover:bg-slate-800' },
    { s: 'no_convocada',label: '–', active: 'bg-slate-700 text-slate-300', inactive: 'text-slate-700 hover:bg-slate-800' },
  ]

  const isOut = status === 'no_convocada'
  const posColor = player.position ? (POSITION_COLORS[player.position] ?? 'text-slate-400') : 'text-slate-400'

  return (
    <div className={`grid grid-cols-[2.5rem_1fr_6rem_4.5rem_3.5rem_3.5rem_3.5rem_3.5rem] items-center gap-2 px-4 py-2.5 transition-colors ${isOut ? 'opacity-40' : 'hover:bg-slate-800/40'} ${!isLast ? 'border-b border-slate-800/60' : ''}`}>

      <input type="hidden" name={`status_${player.id}`} value={status} />

      {/* # */}
      <span className={`font-[family-name:var(--font-heading)] text-sm font-black ${player.number !== null ? posColor : 'text-slate-700'}`}>
        {player.number ?? '—'}
      </span>

      {/* Jugadora */}
      <div className="flex items-center gap-2.5 min-w-0">
        <PlayerAvatar name={player.name} photoUrl={player.photo_url} position={player.position} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate leading-tight">{player.name}</p>
          {player.position && (
            <p className={`text-[10px] uppercase tracking-wide ${posColor} opacity-70`}>{player.position}</p>
          )}
        </div>
      </div>

      {/* Estado */}
      <div className="flex justify-center rounded-lg overflow-hidden border border-slate-700">
        {statusBtns.map(({ s, label, active, inactive }) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`flex h-8 w-9 items-center justify-center text-xs font-black transition-all cursor-pointer ${status === s ? active : inactive}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Min */}
      <input
        name={`minutes_${player.id}`}
        type="number" min="0" max={120}
        value={minutes}
        onChange={e => setMinutes(Number(e.target.value))}
        disabled={isOut}
        className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 text-center text-sm font-bold font-sans tabular-nums text-white focus:border-slate-500 focus:outline-none disabled:opacity-30"
      />

      {/* Gol, Ast, Am, Rj */}
      {[
        { key: 'goals',   name: `goals_${player.id}`,   color: 'text-green-400',  focus: 'focus:border-green-500/60' },
        { key: 'assists', name: `assists_${player.id}`,  color: 'text-blue-400',   focus: 'focus:border-blue-500/60' },
        { key: 'yellow',  name: `yellow_${player.id}`,   color: 'text-yellow-400', focus: 'focus:border-yellow-500/60' },
        { key: 'red',     name: `red_${player.id}`,      color: 'text-red-400',    focus: 'focus:border-red-500/60' },
      ].map(({ key, name, color, focus }) => (
        <input
          key={key}
          name={name}
          type="number" min="0"
          defaultValue={getDefault(key)}
          disabled={isOut}
          className={`h-9 w-full rounded-lg border border-slate-700 bg-slate-800 text-center text-sm font-bold font-sans tabular-nums focus:outline-none disabled:opacity-30 ${color} ${focus}`}
        />
      ))}
    </div>
  )
}
