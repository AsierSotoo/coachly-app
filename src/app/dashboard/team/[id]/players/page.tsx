import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { addPlayer, togglePlayerActive } from '../../actions'
import Link from 'next/link'

const POSITIONS = ['Portera', 'Defensa', 'Centrocampista', 'Delantera']

export default async function PlayersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id: teamId } = await params
  const supabase = await createClient()

  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()

  if (!team) notFound()

  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .order('number', { ascending: true, nullsFirst: false })

  const active = players?.filter(p => p.active) ?? []
  const inactive = players?.filter(p => !p.active) ?? []
  const sp = await searchParams

  return (
    <div className="min-h-full bg-white">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">← Dashboard</Link>
          <h1 className="mt-1 text-lg font-bold text-gray-900">{team.name} — Plantilla</h1>
          {team.category && <p className="text-sm text-gray-500">{team.category}</p>}
        </div>
        <Link
          href={`/dashboard/team/${teamId}/seasons`}
          className="text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Temporadas →
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Añadir jugadora */}
        <section className="mb-10">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Añadir jugadora</h2>
          <form action={addPlayer} className="flex flex-col gap-3">
            <input type="hidden" name="team_id" value={teamId} />
            <div className="flex gap-2">
              <input
                name="number"
                type="number"
                min="1"
                max="99"
                placeholder="Nº"
                className="w-16 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
              <input
                name="name"
                type="text"
                required
                placeholder="Nombre completo"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
            </div>
            <div className="flex gap-2">
              <select
                name="position"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-900"
              >
                <option value="">Posición (opcional)</option>
                {POSITIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                Añadir
              </button>
            </div>
            {sp.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{sp.error}</p>
            )}
          </form>
        </section>

        {/* Jugadoras activas */}
        <section className="mb-8">
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            Jugadoras activas <span className="text-gray-400 font-normal">({active.length})</span>
          </h2>
          {active.length === 0 ? (
            <p className="text-sm text-gray-400">Aún no hay jugadoras. Añade la primera arriba.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
              {active.map(player => (
                <li key={player.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-right text-sm font-mono text-gray-400">
                      {player.number ?? '—'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{player.name}</p>
                      {player.position && (
                        <p className="text-xs text-gray-500">{player.position}</p>
                      )}
                    </div>
                  </div>
                  <form action={togglePlayerActive}>
                    <input type="hidden" name="player_id" value={player.id} />
                    <input type="hidden" name="team_id" value={teamId} />
                    <input type="hidden" name="active" value="true" />
                    <button type="submit" className="text-xs text-gray-400 hover:text-red-500">
                      Dar de baja
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Jugadoras inactivas */}
        {inactive.length > 0 && (
          <section>
            <h2 className="mb-3 text-base font-semibold text-gray-400">
              Bajas <span className="font-normal">({inactive.length})</span>
            </h2>
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
              {inactive.map(player => (
                <li key={player.id} className="flex items-center justify-between px-4 py-3 opacity-50">
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-right text-sm font-mono text-gray-400">
                      {player.number ?? '—'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-500 line-through">{player.name}</p>
                      {player.position && (
                        <p className="text-xs text-gray-400">{player.position}</p>
                      )}
                    </div>
                  </div>
                  <form action={togglePlayerActive}>
                    <input type="hidden" name="player_id" value={player.id} />
                    <input type="hidden" name="team_id" value={teamId} />
                    <input type="hidden" name="active" value="false" />
                    <button type="submit" className="text-xs text-gray-400 hover:text-green-600">
                      Reactivar
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}
