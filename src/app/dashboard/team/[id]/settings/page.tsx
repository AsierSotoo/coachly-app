import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { updateTeam } from '../../actions'
import Link from 'next/link'

export default async function TeamSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const { id: teamId } = await params
  const supabase = await createClient()

  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()

  if (!team) notFound()

  const sp = await searchParams

  return (
    <div className="min-h-full bg-white">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <Link href={`/dashboard/team/${teamId}/players`} className="text-sm text-gray-500 hover:text-gray-900">
            ← Plantilla
          </Link>
          <h1 className="mt-1 text-lg font-bold text-gray-900">Ajustes del equipo</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-8">
        <form action={updateTeam} className="flex flex-col gap-4">
          <input type="hidden" name="team_id" value={teamId} />

          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nombre del equipo
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={team.name}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="gender" className="text-sm font-medium text-gray-700">
              Género
            </label>
            <select
              id="gender"
              name="gender"
              defaultValue={team.gender ?? ''}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            >
              <option value="">Sin especificar</option>
              <option value="Femenino">Femenino</option>
              <option value="Masculino">Masculino</option>
              <option value="Mixto">Mixto</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="category" className="text-sm font-medium text-gray-700">
              Categoría <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              id="category"
              name="category"
              type="text"
              defaultValue={team.category ?? ''}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            />
          </div>

          {sp.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{sp.error}</p>
          )}
          {sp.saved && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Cambios guardados.</p>
          )}

          <button
            type="submit"
            className="mt-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
          >
            Guardar cambios
          </button>
        </form>
      </main>
    </div>
  )
}
