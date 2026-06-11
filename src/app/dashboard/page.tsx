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
        <h1 className="text-xl font-bold text-gray-900">Mis equipos</h1>
        <Link
          href="/dashboard/team/new"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          + Nuevo equipo
        </Link>
      </div>

      {!teams?.length ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
          <p className="text-gray-500">Aún no tienes ningún equipo.</p>
          <Link
            href="/dashboard/team/new"
            className="mt-4 inline-block text-sm font-medium text-gray-900 underline"
          >
            Crea tu primer equipo
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
          {teams.map(team => (
            <li key={team.id} className="flex items-center justify-between px-4 py-4">
              <div>
                <p className="font-medium text-gray-900">{team.name}</p>
                <p className="text-sm text-gray-400">
                  {[team.gender, team.category].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Link href={`/dashboard/team/${team.id}/players`} className="text-gray-500 hover:text-gray-900">
                  Plantilla
                </Link>
                <Link href={`/dashboard/team/${team.id}/seasons`} className="text-gray-500 hover:text-gray-900">
                  Temporadas
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
