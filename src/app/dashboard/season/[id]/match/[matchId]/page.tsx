import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { saveAppearances } from '../../../actions'
import Link from 'next/link'

export default async function MatchPage({
  params, searchParams,
}: {
  params: Promise<{ id: string; matchId: string }>
  searchParams: Promise<{ saved?: string }>
}) {
  const { id: seasonId, matchId } = await params
  const supabase = await createClient()

  const { data: match } = await supabase
    .from('matches').select('*, seasons(*, teams(*))').eq('id', matchId).single()
  if (!match) notFound()

  const season = match.seasons as { id: string; name: string; teams: { id: string; name: string } }
  const team = season.teams

  const { data: players } = await supabase
    .from('players').select('*').eq('team_id', team.id).eq('active', true)
    .order('number', { ascending: true, nullsFirst: false })

  const { data: appearances } = await supabase
    .from('appearances').select('*').eq('match_id', matchId)

  const appearanceMap = new Map(appearances?.map(a => [a.player_id, a]) ?? [])
  const sp = await searchParams

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/dashboard/season/${seasonId}`} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← {season.name}</Link>
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-xl font-bold text-white">
          {match.home ? 'vs' : '@'} {match.opponent}
        </h1>
        <p className="text-xs text-slate-500">
          {new Date(match.played_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          {match.competition ? ` · ${match.competition}` : ''}
        </p>
      </div>

      {sp.saved && (
        <div className="mb-4 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
          Partido guardado correctamente.
        </div>
      )}

      <form action={saveAppearances} className="flex flex-col gap-6">
        <input type="hidden" name="match_id" value={matchId} />
        <input type="hidden" name="season_id" value={seasonId} />
        <input type="hidden" name="player_ids" value={players?.map(p => p.id).join(',') ?? ''} />

        {/* Resultado */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400">Resultado</h2>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="mb-2 text-xs text-slate-500 truncate max-w-[100px]">{team.name}</p>
              <input
                name="goals_for" type="number" min="0" defaultValue={match.goals_for}
                className="w-20 h-16 text-center text-3xl font-bold font-[family-name:var(--font-heading)]"
              />
            </div>
            <span className="text-2xl text-slate-600 mt-5">—</span>
            <div className="text-center">
              <p className="mb-2 text-xs text-slate-500 truncate max-w-[100px]">{match.opponent}</p>
              <input
                name="goals_against" type="number" min="0" defaultValue={match.goals_against}
                className="w-20 h-16 text-center text-3xl font-bold font-[family-name:var(--font-heading)]"
              />
            </div>
          </div>
        </section>

        {/* Jugadoras */}
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">Jugadoras</h2>

          {!players?.length ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
              <p className="text-sm text-slate-500">No hay jugadoras activas. <Link href={`/dashboard/team/${team.id}/players`} className="text-green-400 underline">Añade jugadoras</Link></p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {players.map(player => {
                const app = appearanceMap.get(player.id)
                const defaultStatus = app ? (app.starter ? 'titular' : 'suplente') : 'no_convocada'

                return (
                  <div key={player.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    {/* Jugadora + estado */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 font-[family-name:var(--font-heading)] text-sm font-bold text-green-400">
                          {player.number ?? '?'}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">{player.name}</p>
                          {player.position && <p className="text-xs text-slate-500">{player.position}</p>}
                        </div>
                      </div>

                      {/* Selector estado */}
                      <div className="flex rounded-lg border border-slate-700 overflow-hidden">
                        {[
                          { val: 'titular', label: 'T' },
                          { val: 'suplente', label: 'S' },
                          { val: 'no_convocada', label: '–' },
                        ].map(({ val, label }) => (
                          <label key={val} className="cursor-pointer">
                            <input
                              type="radio" name={`status_${player.id}`} value={val}
                              defaultChecked={defaultStatus === val}
                              className="sr-only peer"
                            />
                            <span className={`flex h-8 w-9 items-center justify-center text-xs font-bold transition-colors
                              peer-checked:bg-green-500 peer-checked:text-white
                              ${defaultStatus === val ? 'bg-green-500 text-white' : 'text-slate-500 hover:text-slate-300'}
                            `}>
                              {label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    {defaultStatus !== 'no_convocada' && (
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { name: `minutes_${player.id}`, label: "Min'", val: app?.minutes ?? 0, max: 120 },
                          { name: `goals_${player.id}`, label: 'Gol', val: app?.goals ?? 0 },
                          { name: `assists_${player.id}`, label: 'Ast', val: app?.assists ?? 0 },
                          { name: `yellow_${player.id}`, label: 'Am', val: app?.yellow_cards ?? 0, max: 2 },
                          { name: `red_${player.id}`, label: 'Rj', val: app?.red_cards ?? 0, max: 1 },
                        ].map(f => (
                          <div key={f.name} className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-medium text-slate-500 uppercase">{f.label}</span>
                            <input
                              name={f.name} type="number" min="0" max={f.max} defaultValue={f.val}
                              className="h-10 w-full rounded-lg border border-slate-700 bg-slate-800 text-center text-sm font-bold text-white"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <button
          type="submit"
          className="flex h-14 items-center justify-center rounded-2xl bg-green-500 text-sm font-bold text-white hover:bg-green-400 transition-colors cursor-pointer"
        >
          Guardar partido
        </button>
      </form>
    </main>
  )
}
