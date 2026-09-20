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
    : 'suplente'

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

  const statusBtns: { s: Status; label: string; activeBg: string; activeColor: string }[] = [
    { s: 'titular',      label: 'T', activeBg: '#72e697', activeColor: '#07140c' },
    { s: 'suplente',     label: 'S', activeBg: '#2a342d', activeColor: '#89968e' },
    { s: 'no_convocada', label: '–', activeBg: '#171f1a', activeColor: '#637168' },
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
  const posColor = player.position ? (POSITION_COLORS[player.position] ?? 'text-[#89968e]') : 'text-[#89968e]'

  return (
    <div className={`grid grid-cols-[2.5rem_1fr_5rem_5rem_3.5rem_3.5rem_3.5rem_3.5rem_5rem] items-center gap-2 px-4 py-2.5 transition-colors ${!isLast ? 'border-b' : ''}`}
      style={{ opacity: isOut ? 0.4 : 1, borderColor: '#1e2921' }}>

      <input type="hidden" name={`status_${player.id}`} value={status} />

      {/* # */}
      <span className={`font-[family-name:var(--font-heading)] text-sm font-black ${player.number !== null ? posColor : ''}`}
        style={player.number === null ? { color: '#2a342d' } : undefined}>
        {player.number ?? '—'}
      </span>

      {/* Nombre */}
      <div className="flex items-center gap-2.5 min-w-0">
        <PlayerAvatar name={player.name} photoUrl={player.photo_url} position={player.position} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate leading-tight" style={{ color: '#edf2ee' }}>{player.name}</p>
          {player.position && (
            <p className={`text-[10px] uppercase tracking-wide ${posColor} opacity-70`}>{player.position}</p>
          )}
        </div>
      </div>

      {/* Estado */}
      <div className="flex justify-center rounded-lg overflow-hidden border" style={{ borderColor: '#2a342d' }}>
        {statusBtns.map(({ s, label, activeBg, activeColor }) => (
          <button key={s} type="button" onClick={() => setStatus(s)}
            className="flex h-8 w-[calc(100%/3)] items-center justify-center text-xs font-black transition-all cursor-pointer"
            style={{
              backgroundColor: status === s ? activeBg : 'transparent',
              color: status === s ? activeColor : '#3e4d42',
            }}>
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
          className="w-full text-center font-bold tabular-nums focus:outline-none disabled:opacity-30"
          style={{ height: 24, borderRadius: '0.375rem 0.375rem 0 0', borderWidth: 1, borderColor: '#2a342d', backgroundColor: '#161e18', color: '#edf2ee', fontSize: 12, minHeight: 'unset', padding: 0 }}
        />
        <input
          name={`sub_minute_${player.id}`}
          type="number" min="0" max={120}
          value={subMinute}
          onChange={e => handleSubMinute(e.target.value)}
          disabled={isOut}
          placeholder={status === 'titular' ? '↓' : '↑'}
          title={status === 'titular' ? 'Minuto de sustitución (salida)' : 'Minuto de entrada'}
          className="w-full text-center font-bold tabular-nums focus:outline-none disabled:opacity-30"
          style={{ height: 20, borderRadius: '0 0 0.375rem 0.375rem', borderWidth: 1, borderColor: '#2a342d', backgroundColor: '#111713', color: '#637168', fontSize: 10, minHeight: 'unset', padding: 0 }}
        />
      </div>

      {/* GC/Gol, Ast, Am, Rj */}
      {statCols.map(({ name, color, focus, def }) => (
        <input key={name} name={name} type="number" min="0"
          defaultValue={def}
          disabled={isOut}
          className={`w-full rounded-lg text-center font-bold tabular-nums focus:outline-none disabled:opacity-30 ${color} ${focus}`}
          style={{ height: 36, borderWidth: 1, borderColor: '#2a342d', backgroundColor: '#161e18', fontSize: 14, minHeight: 'unset', padding: 0 }}
        />
      ))}

      {/* Valoración */}
      <div className="flex justify-center">
        <StarRating name={`rating_${player.id}`} defaultValue={appearance?.rating} disabled={isOut} />
      </div>
    </div>
  )
}
