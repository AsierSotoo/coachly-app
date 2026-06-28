import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { PageTransition } from '@/components/ui/page-transition'
import { createConvocatoria } from '../actions'

export default async function NewConvocatoriaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: seasonId } = await params
  const supabase = await createClient()

  const { data: season } = await supabase
    .from('seasons').select('name, teams(name)').eq('id', seasonId).single()
  if (!season) notFound()

  const team = (Array.isArray(season.teams) ? season.teams[0] : season.teams) as { name: string }
  const today = new Date().toISOString().split('T')[0]

  return (
    <PageTransition>
      <main className="mx-auto max-w-lg px-4 py-6">

        <Link href={`/dashboard/season/${seasonId}/convocatorias`} className="mb-5 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span> Convocatorias
        </Link>

        <div className="mb-6">
          <h1 className="font-[family-name:var(--font-heading)] text-xl font-black text-white">Nueva convocatoria</h1>
          <p className="text-xs text-slate-500 mt-1">{team.name} · {season.name}</p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur">
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#4be277' }}>group</span>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Datos del partido</p>
          </div>

          <form action={createConvocatoria} className="flex flex-col gap-4 p-5">
            <input type="hidden" name="season_id" value={seasonId} />

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Rival</label>
              <input
                name="opponent" type="text" required
                placeholder="Nombre del equipo rival"
                className="h-11 px-4 text-sm"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Fecha del partido</label>
              <input
                name="played_at" type="date" required
                defaultValue={today}
                className="h-11 px-4 text-sm"
              />
            </div>

            <button
              type="submit"
              className="mt-1 flex h-11 items-center justify-center rounded-xl bg-green-500 text-sm font-bold text-white hover:bg-green-400 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-green-500/20"
            >
              Crear y añadir jugadoras →
            </button>
          </form>
        </div>
      </main>
    </PageTransition>
  )
}
