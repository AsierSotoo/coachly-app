'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { PlayerRow } from './player-row'
import { saveAppearances } from '@/app/dashboard/season/actions'
import { motion } from 'framer-motion'

interface Player {
  id: string
  name: string
  number: number | null
  position: string | null
  active: boolean
}

interface Appearance {
  player_id: string
  starter: boolean
  minutes: number
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
}

interface Match {
  id: string
  opponent: string
  goals_for: number
  goals_against: number
}

interface MatchFormProps {
  match: Match
  players: Player[]
  appearances: Appearance[]
  seasonId: string
  teamName: string
  saved?: boolean
}

export function MatchForm({ match, players, appearances, seasonId, teamName, saved }: MatchFormProps) {
  const appearanceMap = new Map(appearances.map(a => [a.player_id, a]))

  useEffect(() => {
    if (saved) toast.success('Partido guardado', { description: 'Los datos se han actualizado.' })
  }, [saved])

  return (
    <form action={saveAppearances} className="flex flex-col gap-6">
      <input type="hidden" name="match_id" value={match.id} />
      <input type="hidden" name="season_id" value={seasonId} />
      <input type="hidden" name="player_ids" value={players.map(p => p.id).join(',')} />

      {/* Resultado */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400">Resultado final</h2>
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="mb-2 text-xs text-slate-500 truncate max-w-[120px]">{teamName}</p>
            <input
              name="goals_for"
              type="number"
              min="0"
              defaultValue={match.goals_for}
              className="h-20 w-20 rounded-2xl border border-slate-700 bg-slate-800 text-center text-4xl font-bold font-[family-name:var(--font-heading)] text-white focus:border-green-500 focus:outline-none transition-colors"
            />
          </div>
          <span className="text-3xl text-slate-600 mt-5 font-bold">—</span>
          <div className="text-center">
            <p className="mb-2 text-xs text-slate-500 truncate max-w-[120px]">{match.opponent}</p>
            <input
              name="goals_against"
              type="number"
              min="0"
              defaultValue={match.goals_against}
              className="h-20 w-20 rounded-2xl border border-slate-700 bg-slate-800 text-center text-4xl font-bold font-[family-name:var(--font-heading)] text-white focus:border-green-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs text-slate-500 px-1">
        <span className="flex items-center gap-1.5">
          <span className="flex h-5 w-7 items-center justify-center rounded bg-green-500 text-[10px] font-bold text-white">T</span>
          Titular
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-5 w-7 items-center justify-center rounded bg-green-500 text-[10px] font-bold text-white">S</span>
          Suplente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-5 w-7 items-center justify-center rounded bg-slate-700 text-[10px] font-bold text-slate-300">–</span>
          No convocada
        </span>
      </div>

      {/* Jugadoras */}
      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
          Jugadoras · {players.length}
        </h2>
        {players.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
            No hay jugadoras activas en la plantilla.
          </div>
        ) : (
          <motion.div
            className="flex flex-col gap-3"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
          >
            {players.map((player, i) => (
              <motion.div
                key={player.id}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
                }}
              >
                <PlayerRow
                  player={player}
                  appearance={appearanceMap.get(player.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      <button
        type="submit"
        className="flex h-14 items-center justify-center rounded-2xl bg-green-500 text-sm font-bold text-white hover:bg-green-400 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-green-500/20"
      >
        Guardar partido
      </button>
    </form>
  )
}
