import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createMatch, deleteMatch } from '../actions'
import Link from 'next/link'

function resultLabel(goalsFor: number, goalsAgainst: number) {
  if (goalsFor > goalsAgainst) return { text: 'V', cls: 'bg-green-100 text-green-700' }
  if (goalsFor < goalsAgainst) return { text: 'D', cls: 'bg-red-100 text-red-700' }
  return { text: 'E', cls: 'bg-gray-100 text-gray-600' }
}

export default async function SeasonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id: seasonId } = await params
  const supabase = await createClient()

  const { data: season } = await supabase
    .from('seasons')
    .select('*, teams(*)')
    .eq('id', seasonId)
    .single()

  if (!season) notFound()

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('season_id', seasonId)
    .order('played_at', { ascending: false })

  const sp = await searchParams
  const team = season.teams as { id: string; name: string }

  return (
    <div className="min-h-full bg-white">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <Link href={`/dashboard/team/${team.id}/seasons`} className="text-sm text-gray-500 hover:text-gray-900">
            ← {team.name}
          </Link>
          <h1 className="mt-1 text-lg font-bold text-gray-900">Temporada {season.name}</h1>
        </div>
        <Link
          href={`/dashboard/season/${seasonId}/stats`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Ver estadísticas →
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">

        {/* Nuevo partido */}
        <section className="mb-10">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Registrar partido</h2>
          <form action={createMatch} className="flex flex-col gap-3">
            <input type="hidden" name="season_id" value={seasonId} />

            <div className="flex gap-2">
              <input
                name="opponent"
                type="text"
                required
                placeholder="Rival"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
              <input
                name="played_at"
                type="date"
                required
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <div className="flex gap-2">
              <select
                name="home"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-900"
              >
                <option value="true">Local</option>
                <option value="false">Visitante</option>
              </select>
              <input
                name="competition"
                type="text"
                placeholder="Competición (opcional)"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                name="goals_for"
                type="number"
                min="0"
                defaultValue="0"
                className="w-16 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm outline-none focus:border-gray-900"
              />
              <span className="text-sm text-gray-400">—</span>
              <input
                name="goals_against"
                type="number"
                min="0"
                defaultValue="0"
                className="w-16 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm outline-none focus:border-gray-900"
              />
              <span className="text-xs text-gray-400">(nuestros — rival)</span>
              <button
                type="submit"
                className="ml-auto rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                Crear
              </button>
            </div>

            {sp.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{sp.error}</p>
            )}
          </form>
        </section>

        {/* Lista de partidos */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            Partidos <span className="font-normal text-gray-400">({matches?.length ?? 0})</span>
          </h2>
          {!matches?.length ? (
            <p className="text-sm text-gray-400">Aún no hay partidos en esta temporada.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
              {matches.map(match => {
                const result = resultLabel(match.goals_for, match.goals_against)
                return (
                  <li key={match.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${result.cls}`}>
                        {result.text}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {match.home ? 'vs' : '@'} {match.opponent}
                          <span className="ml-2 font-normal text-gray-500">
                            {match.goals_for}–{match.goals_against}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(match.played_at).toLocaleDateString('es-ES')}
                          {match.competition ? ` · ${match.competition}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Link
                        href={`/dashboard/season/${seasonId}/match/${match.id}`}
                        className="text-gray-500 hover:text-gray-900"
                      >
                        Editar →
                      </Link>
                      <form action={deleteMatch}>
                        <input type="hidden" name="match_id" value={match.id} />
                        <input type="hidden" name="season_id" value={seasonId} />
                        <button type="submit" className="text-gray-300 hover:text-red-500 text-xs">
                          ✕
                        </button>
                      </form>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
