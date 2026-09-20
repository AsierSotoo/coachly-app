'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlayerAvatar } from '@/components/team/player-avatar'
import { StarRating } from './star-rating'

type Status = 'titular' | 'suplente' | 'no_convocada'

interface Player {
  id: string
  name: string
  number: number | null
  position: string | null
  photo_url?: string | null
}

interface Appearance {
  starter: boolean
  minutes: number
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  rating?: number | null
  goals_conceded?: number
  sub_minute?: number | null
}

export function PlayerRow({ player, appearance, convocatoriaStatus }: {
  player: Player
  appearance?: Appearance
  convocatoriaStatus?: 'titular' | 'convocada' | 'no_convocada'
}) {
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
      if (status === 'titular' && prevStatus.current !== 'titular') {
        setMinutes(90); setSubMinute('')
      } else if (status !== 'titular' && prevStatus.current === 'titular') {
        setMinutes(0); setSubMinute('')
      }
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

  const statFields = isGK
    ? [
        { key: 'goals_conceded', inputName: `goals_conceded_${player.id}`, label: 'GC',  max: undefined, color: 'text-amber-400', focus: 'focus:border-amber-500/60', defaultVal: appearance?.goals_conceded ?? 0 },
        { key: 'assists',        inputName: `assists_${player.id}`,         label: 'Ast', max: undefined, color: 'text-blue-400',  focus: 'focus:border-blue-500/60',  defaultVal: appearance?.assists ?? 0 },
        { key: 'yellow',         inputName: `yellow_${player.id}`,          label: 'Am',  max: 2,         color: 'text-yellow-400',focus: 'focus:border-yellow-500/60', defaultVal: appearance?.yellow_cards ?? 0 },
        { key: 'red',            inputName: `red_${player.id}`,             label: 'Rj',  max: 1,         color: 'text-red-400',   focus: 'focus:border-red-500/60',   defaultVal: appearance?.red_cards ?? 0 },
      ]
    : [
        { key: 'goals',   inputName: `goals_${player.id}`,   label: 'Gol', max: undefined, color: 'text-green-400',  focus: 'focus:border-green-500/60', defaultVal: appearance?.goals ?? 0 },
        { key: 'assists', inputName: `assists_${player.id}`,  label: 'Ast', max: undefined, color: 'text-blue-400',   focus: 'focus:border-blue-500/60',  defaultVal: appearance?.assists ?? 0 },
        { key: 'yellow',  inputName: `yellow_${player.id}`,   label: 'Am',  max: 2,         color: 'text-yellow-400', focus: 'focus:border-yellow-500/60',defaultVal: appearance?.yellow_cards ?? 0 },
        { key: 'red',     inputName: `red_${player.id}`,      label: 'Rj',  max: 1,         color: 'text-red-400',    focus: 'focus:border-red-500/60',   defaultVal: appearance?.red_cards ?? 0 },
      ]

  const isActive = status !== 'no_convocada'

  return (
    <div
      className="rounded-2xl border p-4 transition-colors"
      style={{
        borderColor: isActive ? '#2a342d' : '#253028',
        backgroundColor: isActive ? '#111713' : '#080d1e',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <PlayerAvatar name={player.name} photoUrl={player.photo_url} position={player.position} size="sm" />
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-[family-name:var(--font-heading)] text-xs font-black"
          style={{ border: '1px solid #2a342d', backgroundColor: '#111713', color: 'var(--accent)' }}
        >
          {player.number ?? '—'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: '#edf2ee' }}>{player.name}</p>
          {player.position && (
            <p className="text-xs truncate" style={{ color: '#637168' }}>{player.position}</p>
          )}
        </div>

        {/* T / S / – toggle */}
        <div className="flex rounded-xl overflow-hidden flex-shrink-0" style={{ border: '1px solid #2a342d' }}>
          {(['titular', 'suplente', 'no_convocada'] as Status[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className="flex h-11 w-10 items-center justify-center text-xs font-bold transition-all active:scale-95"
              style={{
                backgroundColor: status === s
                  ? s === 'no_convocada' ? '#253028' : 'var(--accent)'
                  : 'transparent',
                color: status === s
                  ? s === 'no_convocada' ? '#94a3b8' : 'var(--accent-fg)'
                  : '#637168',
              }}
            >
              {s === 'titular' ? 'T' : s === 'suplente' ? 'S' : '–'}
            </button>
          ))}
        </div>
      </div>

      <input type="hidden" name={`status_${player.id}`} value={status} />

      <AnimatePresence>
        {status !== 'no_convocada' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            {/* Stats grid */}
            <div className="mt-3 grid grid-cols-5 gap-2 pt-3 border-t" style={{ borderColor: '#253028' }}>

              {/* Min + Sub stacked */}
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#637168' }}>Min&apos;</span>
                <input
                  name={`minutes_${player.id}`}
                  type="number" min="0" max={120}
                  value={minutes}
                  onChange={e => setMinutes(Number(e.target.value))}
                  className="h-10 w-full text-center text-base font-bold tabular-nums focus:outline-none transition-colors border-[#2a342d] focus:border-[var(--accent)]/60"
                  style={{
                    border: '1px solid',
                    borderBottomWidth: 0,
                    borderRadius: '8px 8px 0 0',
                    backgroundColor: '#171f1a',
                    color: '#edf2ee',
                  }}
                />
                <input
                  name={`sub_minute_${player.id}`}
                  type="number" min="0" max={120}
                  value={subMinute}
                  onChange={e => handleSubMinute(e.target.value)}
                  placeholder={status === 'titular' ? '↓' : '↑'}
                  title={status === 'titular' ? 'Minuto de sustitución (salida)' : 'Minuto de entrada'}
                  className="h-7 w-full text-center text-[11px] font-bold tabular-nums focus:outline-none"
                  style={{
                    border: '1px solid #2a342d',
                    borderRadius: '0 0 8px 8px',
                    backgroundColor: '#090e0b',
                    color: '#637168',
                  }}
                />
              </div>

              {/* Stat inputs */}
              {statFields.map(f => (
                <div key={f.key} className="flex flex-col items-center gap-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${f.color}`}>{f.label}</span>
                  <input
                    name={f.inputName}
                    type="number" min="0" max={f.max}
                    defaultValue={f.defaultVal}
                    className={`h-10 w-full rounded-xl text-center text-base font-bold tabular-nums focus:outline-none transition-colors ${f.color} ${f.focus}`}
                    style={{ border: '1px solid #2a342d', backgroundColor: '#171f1a' }}
                  />
                </div>
              ))}
            </div>

            {/* Valoración */}
            <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: '#253028' }}>
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#637168' }}>Valoración</span>
              <StarRating name={`rating_${player.id}`} defaultValue={appearance?.rating} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
