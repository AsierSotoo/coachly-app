'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Status = 'titular' | 'suplente' | 'no_convocada'

interface Player {
  id: string
  name: string
  number: number | null
  position: string | null
}

interface Appearance {
  starter: boolean
  minutes: number
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
}

const FIELDS = [
  { key: 'minutes', label: "Min'", max: 120 },
  { key: 'goals', label: 'Gol', max: undefined },
  { key: 'assists', label: 'Ast', max: undefined },
  { key: 'yellow', label: 'Am', max: 2 },
  { key: 'red', label: 'Rj', max: 1 },
]

export function PlayerRow({ player, appearance }: { player: Player; appearance?: Appearance }) {
  const defaultStatus: Status = appearance
    ? appearance.starter ? 'titular' : 'suplente'
    : 'no_convocada'

  const [status, setStatus] = useState<Status>(defaultStatus)

  const getDefault = (key: string) => {
    if (!appearance) return 0
    const map: Record<string, number> = {
      minutes: appearance.minutes,
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
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 font-[family-name:var(--font-heading)] text-sm font-bold text-green-400">
            {player.number ?? '?'}
          </span>
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
              className={`flex h-9 w-10 items-center justify-center text-xs font-bold transition-all ${
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

      {/* Hidden input para el form */}
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
              {FIELDS.map(f => (
                <div key={f.key} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{f.label}</span>
                  <input
                    name={`${f.key}_${player.id}`}
                    type="number"
                    min="0"
                    max={f.max}
                    defaultValue={getDefault(f.key)}
                    className="h-10 w-full rounded-xl border border-slate-700 bg-slate-800 text-center text-sm font-bold text-white focus:border-green-500 focus:outline-none transition-colors"
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
