import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { updateTeam } from '../../actions'
import Link from 'next/link'

export default async function TeamSettingsPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const { id: teamId } = await params
  const supabase = await createClient()
  const { data: team } = await supabase.from('teams').select('*').eq('id', teamId).single()
  if (!team) notFound()
  const sp = await searchParams

  return (
    <main className="mx-auto max-w-sm px-4 py-8">
      <div className="mb-8">
        <Link href={`/dashboard/team/${teamId}/players`} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← Plantilla</Link>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-bold text-white">Ajustes del equipo</h1>
      </div>

      <form action={updateTeam} className="flex flex-col gap-5">
        <input type="hidden" name="team_id" value={teamId} />

        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-slate-400">Nombre</label>
          <input id="name" name="name" type="text" required defaultValue={team.name} className="h-12 px-4 text-sm" />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="gender" className="text-xs font-medium uppercase tracking-wider text-slate-400">Género</label>
          <select id="gender" name="gender" defaultValue={team.gender ?? ''} className="h-12 px-4 text-sm">
            <option value="">Sin especificar</option>
            <option value="Femenino">Femenino</option>
            <option value="Masculino">Masculino</option>
            <option value="Mixto">Mixto</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Categoría <span className="normal-case text-slate-600">(opcional)</span>
          </label>
          <input id="category" name="category" type="text" defaultValue={team.category ?? ''} placeholder="ej. Primera Autonómica" className="h-12 px-4 text-sm" />
        </div>

        {sp.error && <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{sp.error}</p>}
        {sp.saved && <p className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">Cambios guardados.</p>}

        <button type="submit" className="mt-2 flex h-12 items-center justify-center rounded-xl bg-green-500 text-sm font-semibold text-white transition-colors hover:bg-green-400 cursor-pointer">
          Guardar cambios
        </button>
      </form>
    </main>
  )
}
