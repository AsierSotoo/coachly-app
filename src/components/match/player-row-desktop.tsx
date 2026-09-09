'use client'

import { useState, useRef, useEffect } from 'react'
import { PlayerAvatar } from '@/components/team/player-avatar'
import { StarRating } from './star-rating'

type Status = 'titular' | 'suplente' | 'no_convocada'

interface Player {
  id: string; name: string; number: number | null
  position: string | null; photo_url?: string | null
}

interface Appearance {
  starter: boolean; minutes: number; goals: number
  assists: number; yellow_cards: number; red_cards: number
  rating?: number | null; goals_conceded?: number; sub_minute?: number | null
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
  const isGK = (player.position ?? '').toLowerCase().includes('port')

  const defaultStatus: Status = appearance
    ? (appearance.starter ? 'titular' : 'suplente')
    : convocatoriaStatus === 'titular'      ? 'titular'
    : convocatoriaStatus === 'no_convocada' ? 'no_convocada'
    : convocatoriaStatus === 'convocada'    ? 'suplente'
    : 'no_convocada'

  const [status, setStatus] = useState<Status>(defaultStatus)
  const [minutes, setMinutes] = useState<number>(() => {
    if (appearance) return appearance.minutes
    return defaultStatus === 'titular' ? 90 : 0
  })
  const [subMinute, setSubMinute] = useState<number | ''>(() => {
    if (appearance?.sub_minute != null) return appearance.sub_minute
    return ''
  })

  const prevStatus = useRef<Status>(defaultStatus)
  useEffect(() => {
    if (!appearance) {
      if (status === 'titular' && prevStatus.current !== 'titular') { setMinutes(90); setSubMinute('') }
      else if (status !== 'titular' && prevStatus.current === 'titular') { setMinutes(0); setSubMinute('') }
    }
    prevStatus.current = status
  }, [status, appearance])

  function handleSubMinute(val: string) {
    if (!val) { setSubMinute(''); return }
    const n = Math.max(0, Math.min(120, Number(val)))
    setSubMinute(n)
    if (status === 'titular') setMinutes(n)
    else if (status === 'suplente') setMinutes(Math.max(0, 90 - n))
  }

  const statusBtns: { s: Status; label: string; active: string; inactive: string }[] = [
    { s: 'titular',      label: 'T', active: 'bg-green-500 text-white',      inactive: 'text-slate-600 hover:bg-slate-800' },
    { s: 'suplente',     label: 'S', active: 'bg-slate-500 text-white',      inactive: 'text-slate-600 hover:bg-slate-800' },
    { s: 'no_convocada', label: '–', active: 'bg-slate-700 text-slate-300',  inactive: 'text-slate-700 hover:bg-slate-800' },
  ]

  // Para GK: GC (goles concedidos) en lugar de Gol
  const statCols = isGK
    ? [
        { name: `goals_conceded_${player.id}`, color: 'text-amber-400',   focus: 'focus:border-amber-500/60',  def: appearance?.goals_conceded ?? 0 },
        { name: `assists_${player.id}`,         color: 'text-blue-400',    focus: 'focus:border-blue-500/60',   def: appearance?.assists ?? 0 },
        { name: `yellow_${player.id}`,          color: 'text-yellow-400',  focus: 'focus:border-yellow-500/60', def: appearance?.yellow_cards ?? 0 },
        { name: `red_${player.id}`,             color: 'text-red-400',     focus: 'focus:border-red-500/60',    def: appearance?.red_cards ?? 0 },
      ]
    : [
        { name: `goals_${player.id}`,   color: 'text-green-400',  focus: 'focus:border-green-500/60', def: appearance?.goals ?? 0 },
        { name: `assists_${player.id}`, color: 'text-blue-400',   focus: 'focus:border-blue-500/60',  def: appearance?.assists ?? 0 },
        { name: `yellow_${player.id}`,  color: 'text-yellow-400', focus: 'focus:border-yellow-500/60',def: appearance?.yellow_cards ?? 0 },
        { name: `red_${player.id}`,     color: 'text-red-400',    focus: 'focus:border-red-500/60',   def: appearance?.red_cards ?? 0 },
      ]

  const isOut = status === 'no_convocada'
  const posColor = player.position ? (POSITION_COLORS[player.position] ?? 'text-slate-400') : 'text-slate-400'

  return (
    <div className={`grid grid-cols-[2.5rem_1fr_5rem_5rem_3.5rem_3.5rem_3.5rem_3.5rem_5rem] items-center gap-2 px-4 py-2.5 transition-colors ${isOut ? 'opacity-40' : 'hover:bg-slate-800/40'} ${!isLast ? 'border-b border-slate-800/60' : ''}`}>

      <input type="hidden" name={`status_${player.id}`} value={status} />

      {/* # */}
      <span className={`font-[family-name:var(--font-heading)] text-sm font-black ${player.number !== null ? posColor : 'text-slate-700'}`}>
        {player.number ?? '—'}
      </span>

      {/* Nombre */}
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
          <button key={s} type="button" onClick={() => setStatus(s)}
            className={`flex h-8 w-[calc(100%/3)] items-center justify-center text-xs font-black transition-all cursor-pointer ${status === s ? active : inactive}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Min + Sub apilados */}
      <div className="flex flex-col gap-0.5">
        <input
          name={`minutes_${player.id}`}
          type="number" min="0" max={120}
          value={minutes}
          onChange={e => setMinutes(Number(e.target.value))}
          disabled={isOut}
          className="h-6 w-full rounded-t-lg border border-b-0 border-slate-700 bg-slate-800 text-center text-xs font-bold tabular-nums text-white focus:outline-none disabled:opacity-30"
        />
        <input
          name={`sub_minute_${player.id}`}
          type="number" min="0" max={120}
          value={subMinute}
          onChange={e => handleSubMinute(e.target.value)}
          disabled={isOut}
          placeholder={status === 'titular' ? '↓' : '↑'}
          title={status === 'titular' ? 'Minuto de sustitución (salida)' : 'Minuto de entrada'}
          className="h-5 w-full rounded-b-lg border border-slate-700 bg-slate-900 text-center text-[10px] font-bold tabular-nums focus:outline-none disabled:opacity-30"
          style={{ color: '#475569' }}
        />
      </div>

      {/* GC/Gol, Ast, Am, Rj */}
      {statCols.map(({ name, color, focus, def }) => (
        <input key={name} name={name} type="number" min="0"
          defaultValue={def}
          disabled={isOut}
          className={`h-9 w-full rounded-lg border border-slate-700 bg-slate-800 text-center text-sm font-bold tabular-nums focus:outline-none disabled:opacity-30 ${color} ${focus}`}
        />
      ))}

      {/* Valoración */}
      <div className="flex justify-center">
        <StarRating name={`rating_${player.id}`} defaultValue={appearance?.rating} disabled={isOut} />
      </div>
    </div>
  )
}
