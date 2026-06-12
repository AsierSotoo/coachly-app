import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { updateTeam } from '../../actions'
import { LogoUpload } from '@/components/team/logo-upload'
import { PageTransition } from '@/components/ui/page-transition'
import { ChevronLeft } from 'lucide-react'
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
    <PageTransition>
      <main className="mx-auto max-w-sm px-4 py-8">
        <div className="mb-8">
          <Link href={`/dashboard/team/${teamId}/players`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <ChevronLeft className="h-3 w-3" /> Plantilla
          </Link>
          <h1 className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-bold text-white">Ajustes del equipo</h1>
        </div>

        {/* Escudo */}
        <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Escudo del equipo</p>
          <LogoUpload teamId={teamId} currentUrl={team.logo_url} teamName={team.name} />
        </div>

        {/* Datos */}
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

          {sp.error && <p className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{sp.error}</p>}
          {sp.saved && <p className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">Cambios guardados.</p>}

          <button type="submit" className="flex h-12 items-center justify-center rounded-xl bg-green-500 text-sm font-bold text-white transition-all hover:bg-green-400 active:scale-95 cursor-pointer shadow-lg shadow-green-500/20">
            Guardar cambios
          </button>
        </form>
      </main>
    </PageTransition>
  )
}
