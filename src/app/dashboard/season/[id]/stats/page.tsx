import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

const YELLOW_CARD_WARNING = 4 // aviso a partir de 4 amarillas acumuladas

export default async function StatsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: seasonId } = await params
  const supabase = await createClient()

  const { data: season } = await supabase
    .from('seasons')
    .select('*, teams(*)')
    .eq('id', seasonId)
    .single()

  if (!season) notFound()

  const team = season.teams as { id: string; name: string }

  const [{ data: matches }, { data: appearances }, { data: players }] = await Promise.all([
    supabase.from('matches').select('*').eq('season_id', seasonId).order('played_at'),
    supabase.from('appearances').select('*, players(name, number, position)').in(
      'match_id',
      await supabase.from('matches').select('id').eq('season_id', seasonId)
        .then(r => r.data?.map(m => m.id) ?? [])
    ),
    supabase.from('players').select('*').eq('team_id', team.id).eq('active', true),
  ])

  // Resumen de temporada
  const wins = matches?.filter(m => m.goals_for > m.goals_against).length ?? 0
  const draws = matches?.filter(m => m.goals_for === m.goals_against).length ?? 0
  const losses = matches?.filter(m => m.goals_for < m.goals_against).length ?? 0
  const goalsFor = matches?.reduce((s, m) => s + m.goals_for, 0) ?? 0
  const goalsAgainst = matches?.reduce((s, m) => s + m.goals_against, 0) ?? 0
  const totalMatches = matches?.length ?? 0

  // Racha (últimos 5 partidos)
  const recentMatches = [...(matches ?? [])].reverse().slice(0, 5)
  const streak = recentMatches.map(m => {
    if (m.goals_for > m.goals_against) return { r: 'V', cls: 'bg-green-500' }
    if (m.goals_for < m.goals_against) return { r: 'D', cls: 'bg-red-500' }
    return { r: 'E', cls: 'bg-gray-400' }
  })

  // Stats por jugadora
  type PlayerStat = {
    playerId: string; name: string; number: number | null; position: string | null
    goals: number; assists: number; minutes: number
    yellowCards: number; redCards: number; gamesPlayed: number
  }

  const statsMap = new Map<string, PlayerStat>()

  for (const app of appearances ?? []) {
    const p = app.players as { name: string; number: number | null; position: string | null }
    if (!statsMap.has(app.player_id)) {
      statsMap.set(app.player_id, {
        playerId: app.player_id, name: p.name, number: p.number, position: p.position,
        goals: 0, assists: 0, minutes: 0, yellowCards: 0, redCards: 0, gamesPlayed: 0,
      })
    }
    const s = statsMap.get(app.player_id)!
    s.goals += app.goals ?? 0
    s.assists += app.assists ?? 0
    s.minutes += app.minutes ?? 0
    s.yellowCards += app.yellow_cards ?? 0
    s.redCards += app.red_cards ?? 0
    if ((app.minutes ?? 0) > 0) s.gamesPlayed++
  }

  const stats = Array.from(statsMap.values())
  const byGoals = [...stats].sort((a, b) => b.goals - a.goals || b.assists - a.assists)
  const byAssists = [...stats].sort((a, b) => b.assists - a.assists || b.goals - a.goals)
  const byMinutes = [...stats].sort((a, b) => b.minutes - a.minutes)
  const byCards = [...stats].filter(s => s.yellowCards > 0 || s.redCards > 0)
    .sort((a, b) => b.yellowCards - a.yellowCards)
  const byGames = [...stats].sort((a, b) => b.gamesPlayed - a.gamesPlayed)

  return (
    <div className="min-h-full bg-white">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <Link href={`/dashboard/season/${seasonId}`} className="text-sm text-gray-500 hover:text-gray-900">
            ← {season.name}
          </Link>
          <h1 className="mt-1 text-lg font-bold text-gray-900">{team.name} — Estadísticas</h1>
          <p className="text-sm text-gray-500">Temporada {season.name}</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 space-y-10">

        {/* Resumen */}
        <section>
          <h2 className="mb-4 text-base font-semibold text-gray-900">Resumen de temporada</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Partidos" value={totalMatches} />
            <Stat label="Victorias" value={wins} color="text-green-600" />
            <Stat label="Empates" value={draws} color="text-gray-500" />
            <Stat label="Derrotas" value={losses} color="text-red-500" />
            <Stat label="Goles a favor" value={goalsFor} />
            <Stat label="Goles en contra" value={goalsAgainst} />
            <Stat label="Diferencia" value={goalsFor - goalsAgainst} color={goalsFor >= goalsAgainst ? 'text-green-600' : 'text-red-500'} sign />
          </div>

          {streak.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs text-gray-500 uppercase tracking-wide">Últimos {streak.length} partidos</p>
              <div className="flex gap-1.5">
                {streak.map((s, i) => (
                  <span key={i} className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${s.cls}`}>
                    {s.r}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Goleadoras */}
        {byGoals.some(s => s.goals > 0) && (
          <section>
            <h2 className="mb-3 text-base font-semibold text-gray-900">Goleadoras</h2>
            <StatsTable
              rows={byGoals.filter(s => s.goals > 0)}
              cols={[
                { label: 'Goles', fn: s => s.goals, highlight: true },
                { label: 'Asist.', fn: s => s.assists },
              ]}
            />
          </section>
        )}

        {/* Asistencias */}
        {byAssists.some(s => s.assists > 0) && (
          <section>
            <h2 className="mb-3 text-base font-semibold text-gray-900">Asistencias</h2>
            <StatsTable
              rows={byAssists.filter(s => s.assists > 0)}
              cols={[
                { label: 'Asist.', fn: s => s.assists, highlight: true },
                { label: 'Goles', fn: s => s.goals },
              ]}
            />
          </section>
        )}

        {/* Minutos */}
        {byMinutes.some(s => s.minutes > 0) && (
          <section>
            <h2 className="mb-3 text-base font-semibold text-gray-900">Reparto de minutos</h2>
            <div className="space-y-2">
              {byMinutes.filter(s => s.minutes > 0).map((s, i) => {
                const maxMinutes = byMinutes[0].minutes
                const pct = maxMinutes > 0 ? Math.round((s.minutes / maxMinutes) * 100) : 0
                return (
                  <div key={s.playerId} className="flex items-center gap-3">
                    <span className="w-5 text-right text-xs text-gray-400">{i + 1}</span>
                    <span className="w-36 truncate text-sm text-gray-700">{s.name}</span>
                    <div className="flex-1 rounded-full bg-gray-100 h-2">
                      <div className="h-2 rounded-full bg-gray-800" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-12 text-right text-sm text-gray-600">{s.minutes}'</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Tarjetas */}
        {byCards.length > 0 && (
          <section>
            <h2 className="mb-3 text-base font-semibold text-gray-900">Tarjetas</h2>
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
              {byCards.map(s => (
                <li key={s.playerId} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    {s.yellowCards >= YELLOW_CARD_WARNING && (
                      <p className="text-xs text-amber-600 font-medium">⚠ {s.yellowCards} amarillas acumuladas</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {s.yellowCards > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-3.5 w-2.5 rounded-sm bg-yellow-400" />
                        <span className="font-medium">{s.yellowCards}</span>
                      </span>
                    )}
                    {s.redCards > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-3.5 w-2.5 rounded-sm bg-red-500" />
                        <span className="font-medium">{s.redCards}</span>
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Partidos jugados */}
        {byGames.some(s => s.gamesPlayed > 0) && (
          <section>
            <h2 className="mb-3 text-base font-semibold text-gray-900">Partidos jugados</h2>
            <StatsTable
              rows={byGames.filter(s => s.gamesPlayed > 0)}
              cols={[
                { label: 'PJ', fn: s => s.gamesPlayed, highlight: true },
                { label: 'Min', fn: s => s.minutes },
              ]}
            />
          </section>
        )}

        {totalMatches === 0 && (
          <p className="text-center text-gray-400 py-10">
            Aún no hay partidos registrados en esta temporada.
          </p>
        )}
      </main>
    </div>
  )
}

function Stat({ label, value, color = 'text-gray-900', sign = false }: {
  label: string; value: number; color?: string; sign?: boolean
}) {
  return (
    <div className="rounded-xl border border-gray-200 px-4 py-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>
        {sign && value > 0 ? '+' : ''}{value}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

type StatRow = { playerId: string; name: string; number: number | null }
function StatsTable({ rows, cols }: {
  rows: StatRow[]
  cols: { label: string; fn: (r: any) => number; highlight?: boolean }[]
}) {
  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
      {rows.map((row, i) => (
        <li key={row.playerId} className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="w-5 text-right text-xs text-gray-400">{i + 1}</span>
            <div>
              <p className="text-sm font-medium text-gray-900">{row.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {cols.map(col => (
              <div key={col.label} className="text-center min-w-[2rem]">
                <p className={`text-sm font-bold ${col.highlight ? 'text-gray-900' : 'text-gray-400'}`}>
                  {col.fn(row)}
                </p>
                <p className="text-xs text-gray-400">{col.label}</p>
              </div>
            ))}
          </div>
        </li>
      ))}
    </ul>
  )
}
