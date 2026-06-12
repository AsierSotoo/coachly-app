import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createMatch, deleteMatch } from '../actions'
import Link from 'next/link'
import { ChevronLeft, BarChart3, MapPin, Swords, Plus, X } from 'lucide-react'
import { PageTransition } from '@/components/ui/page-transition'
import { AnimatedList, AnimatedItem } from '@/components/ui/animated-card'
import { TeamLogo } from '@/components/team/team-logo'

function resultBadge(gf: number, ga: number) {
  if (gf > ga) return { text: 'V', cls: 'bg-green-500 text-white shadow-md shadow-green-500/40', score: 'text-green-400' }
  if (gf < ga) return { text: 'D', cls: 'bg-red-500 text-white shadow-md shadow-red-500/30', score: 'text-red-400' }
  return { text: 'E', cls: 'bg-slate-600 text-white', score: 'text-slate-400' }
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
  const team = season.teams as { id: string; name: string; logo_url?: string | null }
  const wins = matches?.filter(m => m.goals_for > m.goals_against).length ?? 0
  const draws = matches?.filter(m => m.goals_for === m.goals_against).length ?? 0
  const losses = matches?.filter(m => m.goals_for < m.goals_against).length ?? 0

  return (
    <PageTransition>
      <main className="mx-auto max-w-2xl px-4 py-6">

        {/* Header */}
        <div className="mb-6">
          <Link href={`/dashboard/team/${team.id}/seasons`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <ChevronLeft className="h-3 w-3" />{team.name}
          </Link>
          <div className="mt-3 flex items-end justify-between">
            <div className="flex items-center gap-3">
              <TeamLogo name={team.name} logoUrl={team.logo_url} size="lg" />
              <div>
              <h1 className="font-[family-name:var(--font-heading)] text-2xl font-black text-white">
                Temporada {season.name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">{matches?.length ?? 0} partidos registrados</p>
            </div>
            </div>
            <Link
              href={`/dashboard/season/${seasonId}/stats`}
              className="flex items-center gap-1.5 rounded-xl bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs font-bold text-green-400 hover:bg-green-500/20 transition-colors cursor-pointer"
            >
              <BarChart3 className="h-3.5 w-3.5" /> Estadísticas
            </Link>
          </div>
        </div>

        {/* Mini record */}
        {(matches?.length ?? 0) > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-2">
            {[
              { label: 'V', value: wins, cls: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
              { label: 'E', value: draws, cls: 'text-slate-400', bg: 'bg-slate-800 border-slate-700' },
              { label: 'D', value: losses, cls: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
            ].map(({ label, value, cls, bg }) => (
              <div key={label} className={`flex items-center justify-center gap-3 rounded-2xl border ${bg} py-4`}>
                <span className={`font-[family-name:var(--font-heading)] text-3xl font-black ${cls}`}>{value}</span>
                <span className="text-xs text-slate-500">{label === 'V' ? 'Victorias' : label === 'E' ? 'Empates' : 'Derrotas'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Nuevo partido */}
        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur">
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
            <Plus className="h-3.5 w-3.5 text-green-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Nuevo partido</h2>
          </div>
          <form action={createMatch} className="p-4 flex flex-col gap-3">
            <input type="hidden" name="season_id" value={seasonId} />
            <div className="flex gap-2">
              <input name="opponent" type="text" required placeholder="Rival" className="flex-1 h-11 px-3 text-sm" />
              <input name="played_at" type="date" required className="h-11 px-3 text-sm" />
            </div>
            <div className="flex gap-2">
              <select name="home" className="flex-1 h-11 px-3 text-sm">
                <option value="true">🏠 Local</option>
                <option value="false">✈️ Visitante</option>
              </select>
              <input name="competition" type="text" placeholder="Competición" className="flex-1 h-11 px-3 text-sm" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2.5">
                <input name="goals_for" type="number" min="0" defaultValue="0"
                  className="w-10 bg-transparent text-center text-2xl font-black font-[family-name:var(--font-heading)] text-white border-0 outline-none" />
                <span className="text-lg font-bold text-slate-600">—</span>
                <input name="goals_against" type="number" min="0" defaultValue="0"
                  className="w-10 bg-transparent text-center text-2xl font-black font-[family-name:var(--font-heading)] text-white border-0 outline-none" />
              </div>
              <span className="text-xs text-slate-600">nosotros — rival</span>
              <button type="submit"
                className="ml-auto flex items-center gap-1.5 rounded-xl bg-green-500 px-5 h-11 text-sm font-bold text-white hover:bg-green-400 active:scale-95 transition-all cursor-pointer shadow-lg shadow-green-500/20">
                <Plus className="h-4 w-4" /> Crear
              </button>
            </div>
            {sp.error && <p className="text-sm text-red-400">{sp.error}</p>}
          </form>
        </div>

        {/* Lista de partidos */}
        {!matches?.length ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 py-12 text-center">
            <Swords className="h-8 w-8 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Aún no hay partidos en esta temporada.</p>
          </div>
        ) : (
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
              Resultados
            </h2>
            <AnimatedList>
              {matches.map((match, i) => {
                const badge = resultBadge(match.goals_for, match.goals_against)
                return (
                  <AnimatedItem key={match.id} delay={i * 0.04}>
                    <div className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3.5 hover:border-slate-700 transition-all backdrop-blur">
                      {/* Result badge */}
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${badge.cls}`}>
                        {badge.text}
                      </span>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white truncate">
                            {match.home ? 'vs' : '@'} {match.opponent}
                          </p>
                          {!match.home && <MapPin className="h-3 w-3 shrink-0 text-slate-600" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(match.played_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {match.competition ? ` · ${match.competition}` : ''}
                        </p>
                      </div>

                      {/* Score */}
                      <span className={`font-[family-name:var(--font-heading)] text-xl font-black ${badge.score} min-w-[3rem] text-center`}>
                        {match.goals_for}–{match.goals_against}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/dashboard/season/${seasonId}/match/${match.id}`}
                          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
                          Editar
                        </Link>
                        <form action={deleteMatch}>
                          <input type="hidden" name="match_id" value={match.id} />
                          <input type="hidden" name="season_id" value={seasonId} />
                          <button type="submit"
                            className="rounded-lg border border-slate-700 p-1.5 text-slate-600 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      </div>
                    </div>
                  </AnimatedItem>
                )
              })}
            </AnimatedList>
          </div>
        )}
      </main>
    </PageTransition>
  )
}
