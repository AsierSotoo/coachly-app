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

  const quickTitles = ['Táctica', 'Físico', 'Técnica', 'Partido', 'Recuperación', 'Rondos']

  return (
    <PageTransition>
      <main className="max-w-2xl mx-auto px-4 py-6 pb-32 md:pb-10">

        {/* Breadcrumb */}
        <Link href={`/dashboard/season/${seasonId}/trainings`}
          className="inline-flex items-center gap-1 text-[11px] font-semibold mb-6 transition-colors hover:opacity-80"
          style={{ color: 'var(--tx-3)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span>
          Entrenamientos
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--accent-subtle)', border: '1px solid var(--accent)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 22 }}>fitness_center</span>
          </div>
          <div>
            <h1 className="text-[28px] font-extrabold leading-tight" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--tx)' }}>
              Nueva sesión
            </h1>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--tx-3)' }}>{team.name} · {season.name}</p>
          </div>
        </div>

        <form action={createTrainingSession} className="flex flex-col gap-5">
          <input type="hidden" name="season_id" value={seasonId} />
          <input type="hidden" name="team_id" value={team.id} />

          {/* Fecha */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--tx-3)' }}>
              Fecha <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <input name="date" type="date" required defaultValue={defaultDate}
              className="w-full bg-transparent text-base font-semibold focus:outline-none"
              style={{ color: 'var(--tx)', colorScheme: 'auto' }} />
          </div>

          {/* Hora */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--tx-3)' }}>
              Hora <span style={{ color: 'var(--tx-4)' }}>(opcional)</span>
            </label>
            <input name="start_time" type="time"
              className="bg-transparent text-base font-semibold focus:outline-none"
              style={{ color: 'var(--tx)', colorScheme: 'auto' }} />
          </div>

          {/* Título con chips rápidos */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--tx-3)' }}>
              Título <span style={{ color: 'var(--tx-4)' }}>(opcional)</span>
            </label>
            {/* Quick chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {quickTitles.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={undefined}
                  className="quick-chip px-3 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-3)', backgroundColor: 'var(--bg-elevated)' }}
                  data-value={t}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              id="title-input"
              name="title"
              type="text"
              placeholder="O escribe un título personalizado..."
              className="w-full bg-transparent text-sm focus:outline-none border-t pt-3"
              style={{ color: 'var(--tx)', borderColor: 'var(--bdr-subtle)' }}
            />
          </div>

          {/* Duración */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--tx-3)' }}>
              Duración <span style={{ color: 'var(--tx-4)' }}>(opcional)</span>
            </label>
            <div className="flex items-baseline gap-2">
              <input name="duration_min" type="number" min="1" max="300" placeholder="90"
                className="bg-transparent text-3xl font-black focus:outline-none w-24 tabular-nums"
                style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--tx-3)' }}>minutos</span>
            </div>
          </div>

          {/* Notas */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--tx-3)' }}>
              Notas / sensaciones
            </label>
            <textarea name="notes" rows={5}
              placeholder="Qué se entrenó, sensaciones del equipo, notas para el próximo día..."
              className="w-full bg-transparent text-sm resize-y focus:outline-none leading-relaxed"
              style={{ color: 'var(--tx)', minHeight: 100 }} />
          </div>

          {/* Submit */}
          <button type="submit"
            className="w-full py-4 rounded-2xl text-base font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)', fontFamily: 'Sora, sans-serif' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
            Guardar sesión
          </button>
        </form>

        {/* Script para chips de título rápido */}
        <script dangerouslySetInnerHTML={{ __html: `
          document.querySelectorAll('.quick-chip').forEach(btn => {
            btn.addEventListener('click', () => {
              const input = document.getElementById('title-input');
              if (input) input.value = btn.dataset.value;
            });
          });
        ` }} />
      </main>
    </PageTransition>
  )
}
