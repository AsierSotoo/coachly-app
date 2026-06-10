import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createSeason } from '../../actions'
import Link from 'next/link'

export default async function SeasonsPage({
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

  const { data: seasons } = await supabase
    .from('seasons')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  const sp = await searchParams

  return (
    <div className="min-h-full bg-white">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <Link href={`/dashboard/team/${teamId}/players`} className="text-sm text-gray-500 hover:text-gray-900">
            ← Plantilla
          </Link>
          <h1 className="mt-1 text-lg font-bold text-gray-900">{team.name} — Temporadas</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Nueva temporada */}
        <section className="mb-10">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Nueva temporada</h2>
          <form action={createSeason} className="flex gap-2">
            <input type="hidden" name="team_id" value={teamId} />
            <input
              name="name"
              type="text"
              required
              placeholder="ej. 2025/26"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
            />
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Crear
            </button>
          </form>
          {sp.error && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{sp.error}</p>
          )}
        </section>

        {/* Lista de temporadas */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            Temporadas <span className="text-gray-400 font-normal">({seasons?.length ?? 0})</span>
          </h2>
          {!seasons?.length ? (
            <p className="text-sm text-gray-400">Crea la primera temporada para empezar a registrar partidos.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
              {seasons.map(season => (
                <li key={season.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium text-gray-900">{season.name}</span>
                  <Link
                    href={`/dashboard/season/${season.id}`}
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    Ver partidos →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
