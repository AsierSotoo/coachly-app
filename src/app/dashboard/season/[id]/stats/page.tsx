import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { ChevronLeft, Target, Zap, Clock, AlertTriangle, Gamepad2, TrendingUp } from 'lucide-react'
import { PageTransition } from '@/components/ui/page-transition'

const YELLOW_WARNING = 4

const POSITION_COLORS: Record<string, string> = {
  'Portera': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Defensa': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Centrocampista': 'bg-green-500/15 text-green-400 border-green-500/30',
  'Delantera': 'bg-red-500/15 text-red-400 border-red-500/30',
}

export default async function StatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: seasonId } = await params
  const supabase = await createClient()

  const { data: season } = await supabase.from('seasons').select('*, teams(*)').eq('id', seasonId).single()
  if (!season) notFound()

  const team = season.teams as { id: string; name: string }

  const [{ data: matches }, matchIds] = await Promise.all([
    supabase.from('matches').select('*').eq('season_id', seasonId).order('played_at'),
    supabase.from('matches').select('id').eq('season_id', seasonId).then(r => r.data?.map(m => m.id) ?? []),
  ])

  const { data: appearances } = matchIds.length
    ? await supabase.from('appearances').select('*, players(name, number, position)').in('match_id', matchIds)
    : { data: [] }

  const wins = matches?.filter(m => m.goals_for > m.goals_against).length ?? 0
  const draws = matches?.filter(m => m.goals_for === m.goals_against).length ?? 0
  const losses = matches?.filter(m => m.goals_for < m.goals_against).length ?? 0
  const goalsFor = matches?.reduce((s, m) => s + m.goals_for, 0) ?? 0
  const goalsAgainst = matches?.reduce((s, m) => s + m.goals_against, 0) ?? 0
  const total = matches?.length ?? 0
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
  const streak = [...(matches ?? [])].reverse().slice(0, 5).map(m => {
    if (m.goals_for > m.goals_against) return { r: 'V', cls: 'bg-green-500 text-white', shadow: 'shadow-green-500/30' }
    if (m.goals_for < m.goals_against) return { r: 'D', cls: 'bg-red-500 text-white', shadow: 'shadow-red-500/30' }
    return { r: 'E', cls: 'bg-slate-600 text-white', shadow: '' }
  })

  type PS = { playerId: string; name: string; number: number | null; position: string | null; goals: number; assists: number; minutes: number; yellowCards: number; redCards: number; gamesPlayed: number }
  const statsMap = new Map<string, PS>()
  for (const app of appearances ?? []) {
    const p = app.players as { name: string; number: number | null; position: string | null }
    if (!statsMap.has(app.player_id)) {
      statsMap.set(app.player_id, { playerId: app.player_id, name: p.name, number: p.number, position: p.position, goals: 0, assists: 0, minutes: 0, yellowCards: 0, redCards: 0, gamesPlayed: 0 })
    }
    const s = statsMap.get(app.player_id)!
    s.goals += app.goals ?? 0; s.assists += app.assists ?? 0; s.minutes += app.minutes ?? 0
    s.yellowCards += app.yellow_cards ?? 0; s.redCards += app.red_cards ?? 0
    if ((app.minutes ?? 0) > 0) s.gamesPlayed++
  }
  const stats = Array.from(statsMap.values())
  const byGoals = [...stats].sort((a, b) => b.goals - a.goals || b.assists - a.assists).filter(s => s.goals > 0)
  const byAssists = [...stats].sort((a, b) => b.assists - a.assists || b.goals - a.goals).filter(s => s.assists > 0)
  const byMinutes = [...stats].sort((a, b) => b.minutes - a.minutes).filter(s => s.minutes > 0)
  const byCards = [...stats].filter(s => s.yellowCards > 0 || s.redCards > 0).sort((a, b) => b.yellowCards - a.yellowCards)
  const byGames = [...stats].sort((a, b) => b.gamesPlayed - a.gamesPlayed).filter(s => s.gamesPlayed > 0)

  return (
    <PageTransition>
      <main className="mx-auto max-w-2xl px-4 py-6 pb-10">

        {/* Breadcrumb */}
        <Link href={`/dashboard/season/${seasonId}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-5">
          <ChevronLeft className="h-3 w-3" /> {season.name}
        </Link>

        {/* HERO — resumen de temporada */}
        <div className="relative mb-6 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
          {/* Líneas decorativas */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white" />
            <div className="absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" />
          </div>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/60 to-transparent" />

          <div className="relative">
            <div className="mb-1 text-xs font-medium uppercase tracking-widest text-green-400/70">{team.name}</div>
            <h1 className="font-[family-name:var(--font-heading)] text-2xl font-black text-white">Temporada {season.name}</h1>

            {total === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Sin partidos registrados aún.</p>
            ) : (
              <>
                {/* Macrostat: % victorias */}
                <div className="mt-5 flex items-center gap-6">
                  {/* Donut CSS */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="h-24 w-24 rounded-full"
                      style={{
                        background: `conic-gradient(#22c55e ${winRate * 3.6}deg, #1e293b ${winRate * 3.6}deg)`,
                        padding: '4px',
                      }}
                    >
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 flex-col">
                        <span className="font-[family-name:var(--font-heading)] text-xl font-black text-white">{winRate}%</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wide">Victorias</span>
                      </div>
                    </div>
                  </div>

                  {/* W/D/L */}
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    {[
                      { label: 'Victorias', value: wins, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
                      { label: 'Empates', value: draws, color: 'text-slate-400', bg: 'bg-slate-700/30 border-slate-700' },
                      { label: 'Derrotas', value: losses, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                    ].map(({ label, value, color, bg }) => (
                      <div key={label} className={`rounded-2xl border ${bg} p-3 text-center`}>
                        <p className={`font-[family-name:var(--font-heading)] text-2xl font-black ${color}`}>{value}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Goles */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 rounded-2xl bg-slate-800/60 px-4 py-3 text-center border border-slate-700/50">
                    <p className="font-[family-name:var(--font-heading)] text-3xl font-black text-white">{goalsFor}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Goles a favor</p>
                  </div>
                  <div className="text-2xl font-bold text-slate-700">vs</div>
                  <div className="flex-1 rounded-2xl bg-slate-800/60 px-4 py-3 text-center border border-slate-700/50">
                    <p className="font-[family-name:var(--font-heading)] text-3xl font-black text-slate-400">{goalsAgainst}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">En contra</p>
                  </div>
                  <div className={`flex-1 rounded-2xl px-4 py-3 text-center border ${goalsFor >= goalsAgainst ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <p className={`font-[family-name:var(--font-heading)] text-3xl font-black ${goalsFor >= goalsAgainst ? 'text-green-400' : 'text-red-400'}`}>
                      {goalsFor >= goalsAgainst ? '+' : ''}{goalsFor - goalsAgainst}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Diferencia</p>
                  </div>
                </div>

                {/* Racha */}
                {streak.length > 0 && (
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Racha</span>
                    <div className="flex gap-1.5">
                      {streak.map((s, i) => (
                        <span key={i} className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black shadow-md ${s.cls} ${s.shadow}`}>
                          {s.r}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-slate-600">(últimos {streak.length})</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {total > 0 && (
          <div className="flex flex-col gap-5">

            {/* Goleadoras */}
            {byGoals.length > 0 && (
              <Section icon={<Target className="h-4 w-4 text-green-400" />} title="Goleadoras">
                {byGoals.map((s, i) => (
                  <PlayerStatRow key={s.playerId} rank={i + 1} player={s}
                    primary={{ label: 'Goles', value: s.goals, highlight: true }}
                    secondary={{ label: 'Ast', value: s.assists }}
                  />
                ))}
              </Section>
            )}

            {/* Asistencias */}
            {byAssists.length > 0 && (
              <Section icon={<Zap className="h-4 w-4 text-yellow-400" />} title="Asistencias">
                {byAssists.map((s, i) => (
                  <PlayerStatRow key={s.playerId} rank={i + 1} player={s}
                    primary={{ label: 'Asist.', value: s.assists, highlight: true }}
                    secondary={{ label: 'Goles', value: s.goals }}
                  />
                ))}
              </Section>
            )}

            {/* Minutos */}
            {byMinutes.length > 0 && (
              <Section icon={<Clock className="h-4 w-4 text-blue-400" />} title="Reparto de minutos">
                <div className="flex flex-col gap-3 p-4">
                  {byMinutes.map((s, i) => {
                    const pct = Math.round((s.minutes / byMinutes[0].minutes) * 100)
                    return (
                      <div key={s.playerId} className="flex items-center gap-3">
                        <span className="w-4 text-right text-xs font-bold text-slate-600">{i + 1}</span>
                        <span className="w-28 truncate text-sm font-medium text-slate-300">{s.name}</span>
                        <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-14 text-right font-[family-name:var(--font-heading)] text-xs font-bold text-slate-400">{s.minutes}'</span>
                      </div>
                    )
                  })}
                </div>
              </Section>
            )}

            {/* Tarjetas */}
            {byCards.length > 0 && (
              <Section icon={<AlertTriangle className="h-4 w-4 text-amber-400" />} title="Tarjetas">
                {byCards.map((s) => (
                  <div key={s.playerId} className="flex items-center justify-between px-4 py-3 border-b border-slate-800 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-white">{s.name}</p>
                      {s.yellowCards >= YELLOW_WARNING && (
                        <p className="text-xs font-semibold text-amber-400 mt-0.5">⚠ Riesgo de sanción ({s.yellowCards} amarillas)</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {s.yellowCards > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="h-5 w-3.5 rounded-sm bg-yellow-400 shadow-md shadow-yellow-400/30" />
                          <span className="font-[family-name:var(--font-heading)] text-base font-black text-white">{s.yellowCards}</span>
                        </div>
                      )}
                      {s.redCards > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="h-5 w-3.5 rounded-sm bg-red-500 shadow-md shadow-red-500/30" />
                          <span className="font-[family-name:var(--font-heading)] text-base font-black text-white">{s.redCards}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </Section>
            )}

            {/* Partidos jugados */}
            {byGames.length > 0 && (
              <Section icon={<Gamepad2 className="h-4 w-4 text-slate-400" />} title="Partidos jugados">
                {byGames.map((s, i) => (
                  <PlayerStatRow key={s.playerId} rank={i + 1} player={s}
                    primary={{ label: 'PJ', value: s.gamesPlayed, highlight: true }}
                    secondary={{ label: "Min'", value: s.minutes }}
                  />
                ))}
              </Section>
            )}
          </div>
        )}
      </main>
    </PageTransition>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
        {icon}
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  )
}

function PlayerStatRow({
  rank, player, primary, secondary
}: {
  rank: number
  player: { name: string; number: number | null; position: string | null }
  primary: { label: string; value: number; highlight?: boolean }
  secondary: { label: string; value: number }
}) {
  const posClass = player.position ? (
    {
      'Portera': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      'Defensa': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      'Centrocampista': 'bg-green-500/15 text-green-400 border-green-500/30',
      'Delantera': 'bg-red-500/15 text-red-400 border-red-500/30',
    }[player.position] ?? 'bg-slate-700 text-slate-400 border-slate-600'
  ) : ''

  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition-colors">
      <div className="flex items-center gap-3">
        {/* Rank */}
        <span className="w-5 text-right font-[family-name:var(--font-heading)] text-sm font-black text-slate-700">{rank}</span>

        {/* Dorsal + nombre */}
        <div className="flex items-center gap-2.5">
          {player.number !== null && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 font-[family-name:var(--font-heading)] text-sm font-black text-green-400 border border-slate-700">
              {player.number}
            </span>
          )}
          <div>
            <p className="text-sm font-semibold text-white">{player.name}</p>
            {player.position && (
              <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide mt-0.5 ${posClass}`}>
                {player.position}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="text-center">
          <p className={`font-[family-name:var(--font-heading)] text-xl font-black ${primary.highlight ? 'text-green-400' : 'text-white'}`}>
            {primary.value}
          </p>
          <p className="text-[10px] text-slate-600 uppercase tracking-wide">{primary.label}</p>
        </div>
        <div className="text-center">
          <p className="font-[family-name:var(--font-heading)] text-base font-bold text-slate-500">{secondary.value}</p>
          <p className="text-[10px] text-slate-700 uppercase tracking-wide">{secondary.label}</p>
        </div>
      </div>
    </div>
  )
}
