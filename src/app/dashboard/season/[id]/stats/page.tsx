import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

const YELLOW_WARNING = 4

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

  const streak = [...(matches ?? [])].reverse().slice(0, 5).map(m => {
    if (m.goals_for > m.goals_against) return { r: 'V', cls: 'bg-green-500 text-white' }
    if (m.goals_for < m.goals_against) return { r: 'D', cls: 'bg-red-500 text-white' }
    return { r: 'E', cls: 'bg-slate-700 text-slate-300' }
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
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href={`/dashboard/season/${seasonId}`} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← {season.name}</Link>
          <h1 className="mt-2 font-[family-name:var(--font-heading)] text-xl font-bold text-white">{team.name}</h1>
          <p className="text-xs text-slate-500">Estadísticas · {season.name}</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 py-16 text-center">
          <p className="text-slate-500">Aún no hay partidos registrados.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* Resumen */}
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">Resumen de temporada</h2>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <StatCard label="Victorias" value={wins} color="text-green-400" />
              <StatCard label="Empates" value={draws} color="text-slate-400" />
              <StatCard label="Derrotas" value={losses} color="text-red-400" />
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <StatCard label="A favor" value={goalsFor} color="text-white" />
              <StatCard label="En contra" value={goalsAgainst} color="text-white" />
              <StatCard label="Diferencia" value={goalsFor - goalsAgainst} color={goalsFor >= goalsAgainst ? 'text-green-400' : 'text-red-400'} sign />
            </div>
            {streak.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">Últimos {streak.length} partidos</p>
                <div className="flex gap-1.5">
                  {streak.map((s, i) => (
                    <span key={i} className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${s.cls}`}>{s.r}</span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Goleadoras */}
          {byGoals.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">Goleadoras</h2>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
                {byGoals.map((s, i) => (
                  <div key={s.playerId} className="flex items-center justify-between px-4 py-3 border-b border-slate-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-right text-xs text-slate-600">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{s.name}</p>
                        {s.position && <p className="text-xs text-slate-500">{s.position}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="font-[family-name:var(--font-heading)] text-lg font-bold text-green-400">{s.goals}</p>
                        <p className="text-[10px] text-slate-500">Goles</p>
                      </div>
                      <div className="text-center">
                        <p className="font-[family-name:var(--font-heading)] text-sm font-bold text-slate-400">{s.assists}</p>
                        <p className="text-[10px] text-slate-600">Ast.</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Asistencias */}
          {byAssists.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">Asistencias</h2>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
                {byAssists.map((s, i) => (
                  <div key={s.playerId} className="flex items-center justify-between px-4 py-3 border-b border-slate-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-right text-xs text-slate-600">{i + 1}</span>
                      <p className="text-sm font-medium text-white">{s.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="font-[family-name:var(--font-heading)] text-lg font-bold text-green-400">{s.assists}</p>
                        <p className="text-[10px] text-slate-500">Ast.</p>
                      </div>
                      <div className="text-center">
                        <p className="font-[family-name:var(--font-heading)] text-sm font-bold text-slate-400">{s.goals}</p>
                        <p className="text-[10px] text-slate-600">Goles</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Minutos */}
          {byMinutes.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">Reparto de minutos</h2>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 flex flex-col gap-3">
                {byMinutes.map((s, i) => {
                  const pct = Math.round((s.minutes / byMinutes[0].minutes) * 100)
                  return (
                    <div key={s.playerId} className="flex items-center gap-3">
                      <span className="w-4 text-right text-xs text-slate-600">{i + 1}</span>
                      <span className="w-28 truncate text-sm text-slate-300">{s.name}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-800">
                        <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-12 text-right font-[family-name:var(--font-heading)] text-xs font-bold text-slate-400">{s.minutes}'</span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Tarjetas */}
          {byCards.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">Tarjetas</h2>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
                {byCards.map(s => (
                  <div key={s.playerId} className="flex items-center justify-between px-4 py-3 border-b border-slate-800 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-white">{s.name}</p>
                      {s.yellowCards >= YELLOW_WARNING && (
                        <p className="text-xs font-medium text-amber-400">Riesgo de sanción</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {s.yellowCards > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="h-4 w-3 rounded-sm bg-yellow-400" />
                          <span className="font-[family-name:var(--font-heading)] text-sm font-bold text-white">{s.yellowCards}</span>
                        </div>
                      )}
                      {s.redCards > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="h-4 w-3 rounded-sm bg-red-500" />
                          <span className="font-[family-name:var(--font-heading)] text-sm font-bold text-white">{s.redCards}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Partidos jugados */}
          {byGames.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">Partidos jugados</h2>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
                {byGames.map((s, i) => (
                  <div key={s.playerId} className="flex items-center justify-between px-4 py-3 border-b border-slate-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-right text-xs text-slate-600">{i + 1}</span>
                      <p className="text-sm font-medium text-white">{s.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="font-[family-name:var(--font-heading)] text-lg font-bold text-white">{s.gamesPlayed}</p>
                        <p className="text-[10px] text-slate-500">PJ</p>
                      </div>
                      <div className="text-center">
                        <p className="font-[family-name:var(--font-heading)] text-sm font-bold text-slate-400">{s.minutes}'</p>
                        <p className="text-[10px] text-slate-600">Min</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  )
}

function StatCard({ label, value, color, sign }: { label: string; value: number; color: string; sign?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 py-4 text-center">
      <p className={`font-[family-name:var(--font-heading)] text-2xl font-bold ${color}`}>
        {sign && value > 0 ? '+' : ''}{value}
      </p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  )
}
