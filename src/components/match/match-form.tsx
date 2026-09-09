'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { PlayerRow } from './player-row'
import { PlayerRowDesktop } from './player-row-desktop'
import { FormationEditor } from './formation-editor'
import { saveAppearances } from '@/app/dashboard/season/actions'
import { motion } from 'framer-motion'
import { getTeamTerms } from '@/lib/team-terms'

interface Player {
  id: string
  name: string
  number: number | null
  position: string | null
  active: boolean
  photo_url?: string | null
}

interface Appearance {
  player_id: string
  starter: boolean
  minutes: number
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  rating?: number | null
  pitch_position?: string | null
  goals_conceded?: number
  sub_minute?: number | null
}

interface Match {
  id: string
  opponent: string
  played_at: string
  match_time?: string | null
  home: boolean
  competition: string | null
  competition_type: string | null
  goals_for: number
  goals_against: number
  notes: string | null
  mvp_player_id: string | null
  formation?: string | null
}

interface MatchFormProps {
  match: Match
  players: Player[]
  appearances: Appearance[]
  seasonId: string
  teamName: string
  teamGender?: string | null
  saved?: boolean
  convocatoriaStatuses?: Record<string, 'titular' | 'convocada' | 'no_convocada'>
  isScheduled?: boolean
}

export function MatchForm({ match, players, appearances, seasonId, teamName, teamGender, saved, convocatoriaStatuses, isScheduled }: MatchFormProps) {
  const appearanceMap = new Map(appearances.map(a => [a.player_id, a]))
  const terms = getTeamTerms(teamGender)
  const isFirstEntry = !isScheduled && !convocatoriaStatuses && appearances.length === 0

  const formRef = useRef<HTMLFormElement>(null)
  const [liveGoals, setLiveGoals] = useState(() => appearances.reduce((s, a) => s + a.goals, 0))
  const [liveGoalsAgainst, setLiveGoalsAgainst] = useState(match.goals_against)

  // Determinar viewport para evitar inputs duplicados en el formulario
  // (desktop y móvil usan el mismo nombre de campo — solo uno debe estar en el DOM)
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  function recalcGoals() {
    if (!formRef.current) return
    let total = 0
    formRef.current.querySelectorAll<HTMLInputElement>('[name^="goals_"]').forEach(inp => {
      if (inp.name !== 'goals_for' && inp.name !== 'goals_against') {
        total += Number(inp.value) || 0
      }
    })
    setLiveGoals(total)
    const gaInput = formRef.current.querySelector<HTMLInputElement>('input[name="goals_against"]')
    if (gaInput) setLiveGoalsAgainst(Number(gaInput.value) || 0)
  }

  useEffect(() => {
    if (saved) toast.success('Partido guardado', { description: 'Los datos se han actualizado.' })
  }, [saved])

  return (
    <form ref={formRef} action={saveAppearances} onChange={recalcGoals} className="flex flex-col gap-6">
      <input type="hidden" name="match_id" value={match.id} />
      <input type="hidden" name="season_id" value={seasonId} />
      <input type="hidden" name="player_ids" value={players.map(p => p.id).join(',')} />
      <input type="hidden" name="gk_ids" value={players.filter(p => (p.position ?? '').toLowerCase().includes('port')).map(p => p.id).join(',')} />
      {/* goals_for guardado — fallback si no hay jugadoras con estado asignado */}
      <input type="hidden" name="goals_for" value={match.goals_for} />
      {/* Cuando es un partido programado, al guardar lo marcamos como finalizado */}
      {isScheduled && <input type="hidden" name="new_status" value="finished" />}

      {isScheduled && (
        <div className="rounded-xl border px-4 py-3 flex items-start gap-3"
          style={{ borderColor: 'rgba(251,191,36,0.2)', backgroundColor: 'rgba(251,191,36,0.04)' }}>
          <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={{ color: '#fbbf24', fontSize: 18 }}>schedule</span>
          <p className="text-sm leading-relaxed" style={{ color: '#fde68a' }}>
            Este partido está programado pero no jugado aún. Rellena el resultado y las estadísticas cuando acabe y pulsa <strong>Finalizar partido</strong>.
          </p>
        </div>
      )}

      {/* Datos + Resultado en grid 2 columnas en desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Datos del partido */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400">Datos del partido</h2>
          <div className="flex flex-col gap-2">
            <input name="opponent" type="text" required defaultValue={match.opponent} placeholder="Rival"
              className="w-full h-11 px-3 text-sm" />
            <div className="flex gap-2">
              <input name="played_at" type="date" required defaultValue={match.played_at} className="flex-1 h-11 px-3 text-sm" />
              <input name="match_time" type="time" defaultValue={match.match_time?.slice(0, 5) ?? ''} placeholder="--:--"
                className="w-28 h-11 px-3 text-sm" title="Hora del partido (opcional)" />
              <select name="home" defaultValue={match.home ? 'true' : 'false'} className="h-11 px-3 text-sm">
                <option value="true">🏠 Local</option>
                <option value="false">✈️ Visitante</option>
              </select>
            </div>
            <div className="flex gap-2">
              <select name="competition_type" defaultValue={(match.competition_type as string | null) ?? 'liga'} className="h-11 px-3 text-sm flex-shrink-0">
                <option value="liga">🏆 Liga</option>
                <option value="copa">🥈 Copa</option>
                <option value="amistoso">🤝 Amistoso</option>
              </select>
              <input name="competition" type="text" defaultValue={match.competition ?? ''} placeholder="Nombre competición (opcional)"
                className="flex-1 h-11 px-3 text-sm" />
            </div>
          </div>
        </section>

        {/* Resultado */}
        {(() => {
          const liveResult = liveGoals > liveGoalsAgainst ? 'V' : liveGoals < liveGoalsAgainst ? 'D' : 'E'
          const resultColor = liveResult === 'V' ? '#4be277' : liveResult === 'D' ? '#f87171' : '#fbbf24'
          const resultBg = liveResult === 'V' ? 'rgba(75,226,119,0.08)' : liveResult === 'D' ? 'rgba(248,113,113,0.08)' : 'rgba(251,191,36,0.08)'
          const resultBorder = liveResult === 'V' ? 'rgba(75,226,119,0.2)' : liveResult === 'D' ? 'rgba(248,113,113,0.2)' : 'rgba(251,191,36,0.2)'
          const resultLabel = liveResult === 'V' ? 'Victoria' : liveResult === 'D' ? 'Derrota' : 'Empate'
          return (
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400">Resultado final</h2>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                  style={{ color: resultColor, backgroundColor: resultBg, borderColor: resultBorder }}>
                  {resultLabel}
                </span>
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="flex-1 text-center">
                  <p className="mb-2 text-[11px] font-semibold truncate" style={{ color: '#adb4ce' }}>{teamName}</p>
                  <div className="h-20 w-full max-w-[88px] mx-auto rounded-2xl border flex items-center justify-center text-5xl font-black text-white"
                    style={{
                      fontFamily: 'Sora, sans-serif',
                      backgroundColor: liveGoals > liveGoalsAgainst ? 'rgba(75,226,119,0.08)' : '#191f31',
                      borderColor: liveGoals > liveGoalsAgainst ? 'rgba(75,226,119,0.3)' : '#2e3447',
                    }}
                    title="Se calcula automáticamente de los goles individuales">
                    {liveGoals}
                  </div>
                  <p className="mt-1.5 text-[9px]" style={{ color: '#4be277', opacity: 0.6 }}>Auto ⚽</p>
                </div>
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <span className="text-2xl font-black" style={{ color: '#334155' }}>:</span>
                </div>
                <div className="flex-1 text-center">
                  <p className="mb-2 text-[11px] font-semibold truncate" style={{ color: '#adb4ce' }}>{match.opponent}</p>
                  <input name="goals_against" type="number" min="0" defaultValue={match.goals_against}
                    className="h-20 w-full max-w-[88px] mx-auto rounded-2xl border text-center text-5xl font-black text-white focus:outline-none transition-all block"
                    style={{
                      fontFamily: 'Sora, sans-serif',
                      backgroundColor: liveGoalsAgainst > liveGoals ? 'rgba(248,113,113,0.08)' : '#191f31',
                      borderColor: liveGoalsAgainst > liveGoals ? 'rgba(248,113,113,0.3)' : '#2e3447',
                    }} />
                  <p className="mt-1.5 text-[9px]" style={{ color: '#64748b' }}>Editable</p>
                </div>
              </div>
            </section>
          )
        })()}

      </div>

      {/* Notas del partido */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 18 }}>edit_note</span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Análisis post-partido</h2>
        </div>
        <textarea
          name="notes"
          rows={3}
          defaultValue={match.notes ?? ''}
          placeholder="¿Cómo fue el partido? Pressing, errores defensivos, momentos clave, sensaciones del equipo..."
          className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm resize-none focus:border-green-500/60 focus:outline-none transition-colors leading-relaxed"
          style={{ color: '#dce1fb', minHeight: 'auto' }}
        />
      </section>

      {/* Jugadora del partido */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined" style={{ color: '#facc15', fontSize: 18 }}>star</span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">{terms.p.charAt(0).toUpperCase() + terms.p.slice(1)} del partido</h2>
        </div>
        <select name="mvp_player_id" defaultValue={match.mvp_player_id ?? ''}
          className="w-full h-11 rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm appearance-none focus:border-green-500/60 focus:outline-none transition-colors"
          style={{ color: '#dce1fb' }}>
          <option value="">Sin seleccionar</option>
          {players.map(p => (
            <option key={p.id} value={p.id}>
              {p.number ? `#${p.number} ` : ''}{p.name}
            </option>
          ))}
        </select>
      </section>

      {/* Táctica / Alineación */}
      {!isScheduled && (() => {
        const defaultPositions: Record<string, string> = {}
        for (const a of appearances) {
          if (a.pitch_position) defaultPositions[a.pitch_position] = a.player_id
        }
        const activePlayers = players.filter(p => p.active).map(p => ({
          id: p.id, name: p.name, number: p.number, position: p.position,
        }))
        return (
          <FormationEditor
            players={activePlayers}
            defaultFormation={match.formation}
            defaultPositions={defaultPositions}
          />
        )
      })()}

      {/* Aviso primera vez sin convocatoria */}
      {isFirstEntry && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 flex items-start gap-3">
          <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={{ color: '#60a5fa', fontSize: 18 }}>info</span>
          <p className="text-xs leading-relaxed" style={{ color: '#93c5fd' }}>
            Sin convocatoria previa — todas las {terms.pp} aparecen como <strong>Suplentes</strong>.
            Marca como <strong>T</strong> a las titulares, y como <strong>–</strong> a las que no participaron.
          </p>
        </div>
      )}

      {/* ── TABLA DESKTOP ─────────────────────────────────── */}
      {/* Solo se renderiza en desktop para evitar inputs duplicados con nombres iguales */}
      {(isMobile === null || !isMobile) && (
        <section className="hidden lg:block">
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            {/* Cabecera tabla */}
            <div className="grid grid-cols-[2.5rem_1fr_5rem_5rem_3.5rem_3.5rem_3.5rem_3.5rem_5rem] items-center gap-2 border-b border-slate-800 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest">
              <span className="text-slate-600">#</span>
              <span className="text-slate-600">{terms.p.charAt(0).toUpperCase() + terms.p.slice(1)}</span>
              <span className="text-center text-slate-600">Estado</span>
              <span className="text-center text-slate-500">Min/Sub</span>
              <span className="text-center text-slate-500">G/GC</span>
              <span className="text-center text-blue-400/70">Ast</span>
              <span className="text-center text-yellow-400/70">Am</span>
              <span className="text-center text-red-400/70">Rj</span>
              <span className="text-center text-amber-400/70">Val</span>
            </div>
            <div>
              {players.map((player, i) => (
                <PlayerRowDesktop
                  key={player.id}
                  player={player}
                  appearance={appearanceMap.get(player.id)}
                  convocatoriaStatus={convocatoriaStatuses?.[player.id]}
                  isLast={i === players.length - 1}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CARDS MÓVIL ───────────────────────────────────── */}
      {/* Solo se renderiza en móvil para evitar inputs duplicados con nombres iguales */}
      {(isMobile === null || isMobile) && (
        <section className="lg:hidden">
          <div className="flex items-center gap-4 text-xs text-slate-500 px-1 mb-3">
            {[['T','Titular','bg-green-500'],['S','Suplente','bg-slate-500'],['–',`No ${terms.called}`,'bg-slate-700']].map(([k,l,c]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={`flex h-5 w-6 items-center justify-center rounded ${c} text-[10px] font-bold text-white`}>{k}</span>{l}
              </span>
            ))}
          </div>
          <motion.div className="flex flex-col gap-3" initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}>
            {players.map((player) => (
              <motion.div key={player.id} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } }}>
                <PlayerRow player={player} appearance={appearanceMap.get(player.id)} convocatoriaStatus={convocatoriaStatuses?.[player.id]} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* Guardar / Finalizar */}
      <button type="submit"
        className="flex h-14 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white active:scale-[0.98] transition-all cursor-pointer shadow-lg"
        style={{ backgroundColor: isScheduled ? '#f59e0b' : '#22c55e', boxShadow: isScheduled ? '0 4px 20px rgba(245,158,11,0.25)' : '0 4px 20px rgba(34,197,94,0.2)', color: isScheduled ? '#1c1203' : '#fff' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          {isScheduled ? 'check_circle' : 'save'}
        </span>
        {isScheduled ? 'Finalizar partido' : 'Guardar partido'}
      </button>

      {/* Sticky móvil */}
      <div className="fixed left-0 right-0 z-30 px-4 sm:hidden pointer-events-none"
        style={{ bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))', paddingBottom: 8 }}>
        <button type="submit"
          className="pointer-events-auto w-full flex items-center justify-center gap-2 rounded-2xl text-sm font-bold shadow-2xl active:scale-[0.98] transition-all cursor-pointer"
          style={{ height: 52, backgroundColor: isScheduled ? '#f59e0b' : '#22c55e', color: isScheduled ? '#1c1203' : '#fff' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {isScheduled ? 'check_circle' : 'save'}
          </span>
          {isScheduled ? 'Finalizar partido' : 'Guardar partido'}
        </button>
      </div>
    </form>
  )
}
