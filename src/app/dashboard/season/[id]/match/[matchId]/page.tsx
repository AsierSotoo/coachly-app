import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { saveAppearances } from '../../../actions'
import Link from 'next/link'

export default async function MatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; matchId: string }>
  searchParams: Promise<{ saved?: string }>
}) {
  const { id: seasonId, matchId } = await params
  const supabase = await createClient()

  const { data: match } = await supabase
    .from('matches')
    .select('*, seasons(*, teams(*))')
    .eq('id', matchId)
    .single()

  if (!match) notFound()

  const season = match.seasons as { id: string; name: string; teams: { id: string; name: string } }
  const team = season.teams

  // Jugadoras activas del equipo
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', team.id)
    .eq('active', true)
    .order('number', { ascending: true, nullsFirst: false })

  // Participaciones ya guardadas
  const { data: appearances } = await supabase
    .from('appearances')
    .select('*')
    .eq('match_id', matchId)

  const appearanceMap = new Map(appearances?.map(a => [a.player_id, a]) ?? [])
  const sp = await searchParams

  return (
    <div className="min-h-full bg-white">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <Link href={`/dashboard/season/${seasonId}`} className="text-sm text-gray-500 hover:text-gray-900">
            ← {season.name}
          </Link>
          <h1 className="mt-1 text-lg font-bold text-gray-900">
            {match.home ? 'vs' : '@'} {match.opponent}
          </h1>
          <p className="text-sm text-gray-500">
            {new Date(match.played_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            {match.competition ? ` · ${match.competition}` : ''}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {sp.saved && (
          <p className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">Partido guardado.</p>
        )}

        <form action={saveAppearances}>
          <input type="hidden" name="match_id" value={matchId} />
          <input type="hidden" name="season_id" value={seasonId} />
          <input type="hidden" name="player_ids" value={players?.map(p => p.id).join(',') ?? ''} />

          {/* Resultado */}
          <section className="mb-8">
            <h2 className="mb-3 text-base font-semibold text-gray-900">Resultado</h2>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">{team.name}</span>
                <input
                  name="goals_for"
                  type="number"
                  min="0"
                  defaultValue={match.goals_for}
                  className="w-16 rounded-lg border border-gray-300 px-3 py-2 text-center text-lg font-bold outline-none focus:border-gray-900"
                />
              </div>
              <span className="text-xl text-gray-300 mt-4">—</span>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">{match.opponent}</span>
                <input
                  name="goals_against"
                  type="number"
                  min="0"
                  defaultValue={match.goals_against}
                  className="w-16 rounded-lg border border-gray-300 px-3 py-2 text-center text-lg font-bold outline-none focus:border-gray-900"
                />
              </div>
            </div>
          </section>

          {/* Jugadoras */}
          <section className="mb-6">
            <h2 className="mb-3 text-base font-semibold text-gray-900">Jugadoras</h2>

            {!players?.length ? (
              <p className="text-sm text-gray-400">
                No hay jugadoras activas.{' '}
                <Link href={`/dashboard/team/${team.id}/players`} className="underline">
                  Añade jugadoras
                </Link>
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {players.map(player => {
                  const app = appearanceMap.get(player.id)
                  const defaultStatus = app ? (app.starter ? 'titular' : 'suplente') : 'no_convocada'

                  return (
                    <div key={player.id} className="rounded-xl border border-gray-200 p-4">
                      {/* Cabecera jugadora */}
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-gray-400 w-6 text-right">
                            {player.number ?? '—'}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{player.name}</p>
                            {player.position && <p className="text-xs text-gray-500">{player.position}</p>}
                          </div>
                        </div>

                        {/* Estado */}
                        <div className="flex gap-1">
                          {(['titular', 'suplente', 'no_convocada'] as const).map(status => (
                            <label key={status} className="cursor-pointer">
                              <input
                                type="radio"
                                name={`status_${player.id}`}
                                value={status}
                                defaultChecked={defaultStatus === status}
                                className="peer sr-only"
                              />
                              <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium border transition-colors
                                peer-checked:bg-gray-900 peer-checked:text-white peer-checked:border-gray-900
                                ${defaultStatus === status ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-300 hover:border-gray-500'}
                              `}>
                                {status === 'no_convocada' ? 'No conv.' : status === 'titular' ? 'Titular' : 'Suplente'}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Stats (solo si convocada) */}
                      {defaultStatus !== 'no_convocada' && (
                        <div className="grid grid-cols-5 gap-2 text-center">
                          {[
                            { name: `minutes_${player.id}`, label: 'Min', defaultValue: app?.minutes ?? 0, max: 120 },
                            { name: `goals_${player.id}`, label: 'Goles', defaultValue: app?.goals ?? 0 },
                            { name: `assists_${player.id}`, label: 'Asist.', defaultValue: app?.assists ?? 0 },
                            { name: `yellow_${player.id}`, label: '🟨', defaultValue: app?.yellow_cards ?? 0, max: 2 },
                            { name: `red_${player.id}`, label: '🟥', defaultValue: app?.red_cards ?? 0, max: 1 },
                          ].map(field => (
                            <div key={field.name} className="flex flex-col gap-1">
                              <span className="text-xs text-gray-400">{field.label}</span>
                              <input
                                name={field.name}
                                type="number"
                                min="0"
                                max={field.max}
                                defaultValue={field.defaultValue}
                                className="w-full rounded-lg border border-gray-200 px-1 py-1.5 text-center text-sm outline-none focus:border-gray-900"
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
            className="w-full rounded-xl bg-gray-900 py-3 text-sm font-medium text-white hover:bg-gray-700"
          >
            Guardar partido
          </button>
        </form>
      </main>
    </div>
  )
}
