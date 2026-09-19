import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { PageTransition } from '@/components/ui/page-transition'
import { createTrainingSession } from '../actions'

export default async function NewTrainingPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ date?: string }>
}) {
  const { id: seasonId } = await params
  const sp = await searchParams
  const supabase = await createClient()

  const { data: season } = await supabase
    .from('seasons').select('*, teams(id, name)').eq('id', seasonId).single()
  if (!season) notFound()

  const team = season.teams as { id: string; name: string }
  const defaultDate = sp.date ?? new Date().toISOString().split('T')[0]

  return (
    <PageTransition>
      <main className="max-w-xl mx-auto px-4 py-6 pb-32 md:pb-10">
        <Link href={`/dashboard/season/${seasonId}/trainings`}
          className="flex items-center gap-1 text-xs mb-5 hover:text-slate-300 transition-colors"
          style={{ color: '#637168' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span>
          Entrenamientos
        </Link>

        <h1 className="text-xl font-black text-white mb-6" style={{ fontFamily: 'Sora, sans-serif' }}>
          Nueva sesión
        </h1>

        <form action={createTrainingSession} className="flex flex-col gap-4">
          <input type="hidden" name="season_id" value={seasonId} />
          <input type="hidden" name="team_id" value={team.id} />

          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#111713', borderColor: '#2a342d' }}>
            <div className="divide-y" style={{ borderColor: '#2a342d' }}>

              <div className="flex flex-col gap-1 px-5 py-4">
                <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#89968e' }}>Fecha *</label>
                <input name="date" type="date" required defaultValue={defaultDate}
                  className="bg-transparent text-sm focus:outline-none"
                  style={{ color: '#edf2ee', colorScheme: 'dark' }} />
              </div>

              <div className="flex flex-col gap-1 px-5 py-4">
                <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#89968e' }}>Título <span style={{ color: '#637168' }}>(opcional)</span></label>
                <input name="title" type="text" placeholder="Ej: Táctica, Físico, Rondos..."
                  className="bg-transparent text-sm focus:outline-none placeholder:text-slate-700"
                  style={{ color: '#edf2ee' }} />
              </div>

              <div className="flex flex-col gap-1 px-5 py-4">
                <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#89968e' }}>Duración (min) <span style={{ color: '#637168' }}>(opcional)</span></label>
                <input name="duration_min" type="number" min="1" max="300" placeholder="90"
                  className="bg-transparent text-sm focus:outline-none placeholder:text-slate-700 w-24"
                  style={{ color: '#edf2ee' }} />
              </div>

              <div className="flex flex-col gap-1 px-5 py-4">
                <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#89968e' }}>Notas / sensaciones</label>
                <textarea name="notes" rows={6}
                  placeholder="Qué se entrenó, sensaciones del equipo, notas para el próximo día..."
                  className="bg-transparent text-sm resize-y focus:outline-none placeholder:text-slate-700 leading-relaxed"
                  style={{ color: '#edf2ee' }} />
              </div>

            </div>
          </div>

          <button type="submit"
            className="self-end px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
            style={{ backgroundColor: '#72e697', color: '#07140c' }}>
            Guardar sesión
          </button>
        </form>
      </main>
    </PageTransition>
  )
}
