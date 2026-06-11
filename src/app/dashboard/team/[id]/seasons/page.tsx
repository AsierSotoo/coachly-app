import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createSeason } from '../../actions'
import Link from 'next/link'

export default async function SeasonsPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id: teamId } = await params
  const supabase = await createClient()
  const { data: team } = await supabase.from('teams').select('*').eq('id', teamId).single()
  if (!team) notFound()

  const { data: seasons } = await supabase
    .from('seasons').select('*').eq('team_id', teamId).order('created_at', { ascending: false })

  const sp = await searchParams

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <Link href={`/dashboard/team/${teamId}/players`} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← Plantilla</Link>
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-xl font-bold text-white">{team.name}</h1>
        <p className="text-xs text-slate-500">Temporadas</p>
      </div>

      {/* Nueva temporada */}
      <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400">Nueva temporada</h2>
        <form action={createSeason} className="flex gap-2">
          <input type="hidden" name="team_id" value={teamId} />
          <input name="name" type="text" required placeholder="ej. 2025/26" className="flex-1 h-11 px-3 text-sm" />
          <button type="submit" className="rounded-lg bg-green-500 px-5 h-11 text-sm font-semibold text-white hover:bg-green-400 transition-colors cursor-pointer">
            Crear
          </button>
        </form>
        {sp.error && <p className="mt-2 text-sm text-red-400">{sp.error}</p>}
      </section>

      {/* Lista */}
      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
          Temporadas · {seasons?.length ?? 0}
        </h2>
        {!seasons?.length ? (
          <p className="text-sm text-slate-600 py-4 text-center">Crea la primera temporada para registrar partidos.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {seasons.map(season => (
              <Link
                key={season.id}
                href={`/dashboard/season/${season.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-4 hover:border-slate-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                  </div>
                  <span className="font-semibold text-white">{season.name}</span>
                </div>
                <span className="text-xs text-slate-500">Ver partidos →</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
