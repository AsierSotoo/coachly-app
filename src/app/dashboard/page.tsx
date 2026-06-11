import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-white">Mis equipos</h1>
        <Link
          href="/dashboard/team/new"
          className="flex items-center gap-1.5 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-400 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo equipo
        </Link>
      </div>

      {!teams?.length ? (
        <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-16 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          </div>
          <p className="text-slate-400">Aún no tienes ningún equipo.</p>
          <Link href="/dashboard/team/new" className="mt-3 inline-block text-sm font-medium text-green-400 hover:text-green-300">
            Crea tu primer equipo →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {teams.map(team => (
            <div key={team.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700 cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white">{team.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {[team.gender, team.category].filter(Boolean).join(' · ') || 'Sin categoría'}
                  </p>
                </div>
                <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                  {team.gender ?? 'Equipo'}
                </span>
              </div>
              <div className="mt-4 flex gap-2 border-t border-slate-800 pt-3">
                <Link
                  href={`/dashboard/team/${team.id}/players`}
                  className="flex-1 rounded-lg bg-slate-800 py-2 text-center text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 cursor-pointer"
                >
                  Plantilla
                </Link>
                <Link
                  href={`/dashboard/team/${team.id}/seasons`}
                  className="flex-1 rounded-lg bg-slate-800 py-2 text-center text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 cursor-pointer"
                >
                  Temporadas
                </Link>
                <Link
                  href={`/dashboard/team/${team.id}/settings`}
                  className="rounded-lg bg-slate-800 px-3 py-2 text-center text-xs font-medium text-slate-500 transition-colors hover:bg-slate-700 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
