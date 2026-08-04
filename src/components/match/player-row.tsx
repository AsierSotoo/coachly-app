'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlayerAvatar } from '@/components/team/player-avatar'

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
}

const STAT_FIELDS = [
  { key: 'goals',   label: 'Gol', max: undefined, color: 'text-green-400',  focus: 'focus:border-green-500/60' },
  { key: 'assists', label: 'Ast', max: undefined, color: 'text-blue-400',   focus: 'focus:border-blue-500/60' },
  { key: 'yellow',  label: 'Am',  max: 2,         color: 'text-yellow-400', focus: 'focus:border-yellow-500/60' },
  { key: 'red',     label: 'Rj',  max: 1,         color: 'text-red-400',    focus: 'focus:border-red-500/60' },
]

export function PlayerRow({ player, appearance, convocatoriaStatus }: {
  player: Player
  appearance?: Appearance
  convocatoriaStatus?: 'titular' | 'convocada' | 'no_convocada'
}) {
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
      if (status === 'titular' && prevStatus.current !== 'titular') {
        setMinutes(90)
      } else if (status !== 'titular' && prevStatus.current === 'titular') {
        setMinutes(0)
      }
    }
    prevStatus.current = status
  }, [status, appearance])

  const getDefault = (key: string) => {
    if (!appearance) return 0
    const map: Record<string, number> = {
      goals: appearance.goals,
      assists: appearance.assists,
      yellow: appearance.yellow_cards,
      red: appearance.red_cards,
    }
    return map[key] ?? 0
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PlayerAvatar name={player.name} photoUrl={player.photo_url} position={player.position} size="sm" />
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 font-[family-name:var(--font-heading)] text-xs font-black text-green-400">
            {player.number ?? '—'}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{player.name}</p>
            {player.position && <p className="text-xs text-slate-500">{player.position}</p>}
          </div>
        </div>

        {/* Selector de estado */}
        <div className="flex rounded-xl overflow-hidden border border-slate-700">
          {(['titular', 'suplente', 'no_convocada'] as Status[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`flex h-11 w-10 items-center justify-center text-xs font-bold transition-all ${
                status === s
                  ? s === 'no_convocada'
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-green-500 text-white'
                  : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
              }`}
            >
              {s === 'titular' ? 'T' : s === 'suplente' ? 'S' : '–'}
            </button>
          ))}
        </div>
      </div>

      {/* Hidden inputs */}
      <input type="hidden" name={`status_${player.id}`} value={status} />

      {/* Stats — se muestran/ocultan con animación */}
      <AnimatePresence>
        {status !== 'no_convocada' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 grid grid-cols-5 gap-2 pt-3 border-t border-slate-800">
              {/* Minutos — controlado para el auto-90 */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Min&apos;</span>
                <input
                  name={`minutes_${player.id}`}
                  type="number"
                  min="0"
                  max={120}
                  value={minutes}
                  onChange={e => setMinutes(Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-slate-700 bg-slate-800 text-center text-sm font-bold font-sans tabular-nums text-white focus:border-slate-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Resto de campos — no controlados */}
              {STAT_FIELDS.map(f => (
                <div key={f.key} className="flex flex-col items-center gap-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${f.color}`}>{f.label}</span>
                  <input
                    name={`${f.key}_${player.id}`}
                    type="number"
                    min="0"
                    max={f.max}
                    defaultValue={getDefault(f.key)}
                    className={`h-10 w-full rounded-xl border border-slate-700 bg-slate-800 text-center text-sm font-bold font-sans tabular-nums focus:outline-none transition-colors ${f.color} ${f.focus}`}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
