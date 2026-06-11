import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createMatch, deleteMatch } from '../actions'
import Link from 'next/link'

function resultBadge(gf: number, ga: number) {
  if (gf > ga) return { text: 'V', bg: 'bg-green-500/20 text-green-400 border-green-500/30' }
  if (gf < ga) return { text: 'D', bg: 'bg-red-500/20 text-red-400 border-red-500/30' }
  return { text: 'E', bg: 'bg-slate-700 text-slate-400 border-slate-600' }
}

export default async function SeasonPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id: seasonId } = await params
  const supabase = await createClient()
  const { data: season } = await supabase.from('seasons').select('*, teams(*)').eq('id', seasonId).single()
  if (!season) notFound()

  const { data: matches } = await supabase
    .from('matches').select('*').eq('season_id', seasonId).order('played_at', { ascending: false })

  const sp = await searchParams
  const team = season.teams as { id: string; name: string }

  const wins = matches?.filter(m => m.goals_for > m.goals_against).length ?? 0
  const draws = matches?.filter(m => m.goals_for === m.goals_against).length ?? 0
  const losses = matches?.filter(m => m.goals_for < m.goals_against).length ?? 0

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href={`/dashboard/team/${team.id}/seasons`} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← {team.name}</Link>
          <h1 className="mt-2 font-[family-name:var(--font-heading)] text-xl font-bold text-white">Temporada {season.name}</h1>
        </div>
        <Link
          href={`/dashboard/season/${seasonId}/stats`}
          className="mt-1 flex items-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs font-medium text-green-400 hover:bg-green-500/20 transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          Estadísticas
        </Link>
      </div>

      {/* Mini resumen */}
      {(matches?.length ?? 0) > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-2">
          {[['V', wins, 'text-green-400'], ['E', draws, 'text-slate-400'], ['D', losses, 'text-red-400']].map(([label, val, cls]) => (
            <div key={label as string} className="rounded-xl border border-slate-800 bg-slate-900 py-3 text-center">
              <p className={`text-xl font-bold font-[family-name:var(--font-heading)] ${cls}`}>{val}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label === 'V' ? 'Victorias' : label === 'E' ? 'Empates' : 'Derrotas'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Nuevo partido */}
      <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400">Registrar partido</h2>
        <form action={createMatch} className="flex flex-col gap-3">
          <input type="hidden" name="season_id" value={seasonId} />
          <div className="flex gap-2">
            <input name="opponent" type="text" required placeholder="Rival" className="flex-1 h-11 px-3 text-sm" />
            <input name="played_at" type="date" required className="h-11 px-3 text-sm" />
          </div>
          <div className="flex gap-2">
            <select name="home" className="flex-1 h-11 px-3 text-sm">
              <option value="true">Local</option>
              <option value="false">Visitante</option>
            </select>
            <input name="competition" type="text" placeholder="Competición" className="flex-1 h-11 px-3 text-sm" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2">
              <input name="goals_for" type="number" min="0" defaultValue="0" className="w-10 bg-transparent text-center text-lg font-bold text-white border-0 outline-none" />
              <span className="text-slate-500">—</span>
              <input name="goals_against" type="number" min="0" defaultValue="0" className="w-10 bg-transparent text-center text-lg font-bold text-white border-0 outline-none" />
            </div>
            <span className="text-xs text-slate-600">nosotros — rival</span>
            <button type="submit" className="ml-auto rounded-xl bg-green-500 px-5 h-11 text-sm font-semibold text-white hover:bg-green-400 transition-colors cursor-pointer">
              Crear
            </button>
          </div>
          {sp.error && <p className="text-sm text-red-400">{sp.error}</p>}
        </form>
      </section>

      {/* Partidos */}
      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
          Partidos · {matches?.length ?? 0}
        </h2>
        {!matches?.length ? (
          <p className="text-sm text-slate-600 py-4 text-center">Aún no hay partidos en esta temporada.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {matches.map(match => {
              const badge = resultBadge(match.goals_for, match.goals_against)
              return (
                <div key={match.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${badge.bg}`}>
                    {badge.text}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {match.home ? 'vs' : '@'} {match.opponent}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(match.played_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      {match.competition ? ` · ${match.competition}` : ''}
                    </p>
                  </div>
                  <span className="font-[family-name:var(--font-heading)] text-base font-bold text-white">
                    {match.goals_for}–{match.goals_against}
                  </span>
                  <Link
                    href={`/dashboard/season/${seasonId}/match/${match.id}`}
                    className="ml-1 text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    Editar
                  </Link>
                  <form action={deleteMatch}>
                    <input type="hidden" name="match_id" value={match.id} />
                    <input type="hidden" name="season_id" value={seasonId} />
                    <button type="submit" className="text-slate-700 hover:text-red-400 transition-colors cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </form>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
