import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { PageTransition } from '@/components/ui/page-transition'
import { updateTrainingSession } from '../actions'
import { DeleteTrainingButton } from '@/components/training/delete-training-button'
import { TrainingAttendance } from '@/components/training/training-attendance'
import { AvailabilityCoachCard } from '@/components/disponibilidad/availability-coach-card'

export default async function TrainingSessionPage({
  params, searchParams,
}: {
  params: Promise<{ id: string; sessionId: string }>
  searchParams: Promise<{ saved?: string }>
}) {
  const { id: seasonId, sessionId } = await params
  const sp = await searchParams
  const supabase = await createClient()

  const [{ data: session }, { data: season }] = await Promise.all([
    (supabase.from('training_sessions') as any).select('*, teams(availability_enabled)').eq('id', sessionId).single(),
    supabase.from('seasons').select('name').eq('id', seasonId).single(),
  ])
  if (!session || !season) notFound()

  const availEnabled = !!(session.teams as { availability_enabled?: boolean } | null)?.availability_enabled

  const [{ data: players }, { data: attendanceRows }, { data: availRows }] = await Promise.all([
    supabase.from('players').select('id, name, number, position, photo_url')
      .eq('team_id', session.team_id).eq('active', true)
      .order('number', { ascending: true, nullsFirst: false }),
    supabase.from('training_attendance').select('player_id, attended, absence_reason')
      .eq('session_id', sessionId),
    availEnabled
      ? (supabase.from('training_availability') as any).select('player_id, status').eq('session_id', sessionId)
      : Promise.resolve({ data: [] }),
  ])

  const availResponses = (availRows as { player_id: string; status: string }[] | null) ?? []

  const initialAttendance: Record<string, { attended: boolean; reason: string | null }> = {}
  for (const row of attendanceRows ?? []) {
    initialAttendance[row.player_id] = { attended: row.attended, reason: row.absence_reason ?? null }
  }

  const dateDisplay = new Date(session.date + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const cap = dateDisplay.charAt(0).toUpperCase() + dateDisplay.slice(1)

  return (
    <PageTransition>
      <main className="max-w-xl mx-auto px-4 py-6 pb-32 md:pb-10">
        <Link href={`/dashboard/season/${seasonId}/trainings`}
          className="flex items-center gap-1 text-xs mb-5 hover:text-slate-300 transition-colors"
          style={{ color: '#637168' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span>
          Entrenamientos
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              {session.title ?? 'Entrenamiento'}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#637168' }}>{cap}</p>
          </div>
          {sp.saved && (
            <span className="text-xs font-bold" style={{ color: '#72e697' }}>✓ Guardado</span>
          )}
        </div>

        <div className="flex flex-col gap-5">

          {/* ── Datos de la sesión ── */}
          <form action={updateTrainingSession} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={session.id} />
            <input type="hidden" name="season_id" value={seasonId} />

            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#111713', borderColor: '#2a342d' }}>
              <div className="divide-y" style={{ borderColor: '#2a342d' }}>

                <div className="flex flex-col gap-1 px-5 py-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#89968e' }}>Fecha</label>
                  <input name="date" type="date" required defaultValue={session.date}
                    className="bg-transparent text-sm focus:outline-none"
                    style={{ color: '#edf2ee', colorScheme: 'dark' }} />
                </div>

                <div className="flex flex-col gap-1 px-5 py-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#89968e' }}>
                    Título <span style={{ color: '#637168' }}>(opcional)</span>
                  </label>
                  <input name="title" type="text" placeholder="Ej: Táctica, Físico, Rondos..."
                    defaultValue={session.title ?? ''}
                    className="bg-transparent text-sm focus:outline-none placeholder:text-slate-700"
                    style={{ color: '#edf2ee' }} />
                </div>

                <div className="flex flex-col gap-1 px-5 py-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#89968e' }}>
                    Duración (min) <span style={{ color: '#637168' }}>(opcional)</span>
                  </label>
                  <input name="duration_min" type="number" min="1" max="300" placeholder="90"
                    defaultValue={session.duration_min ?? ''}
                    className="bg-transparent text-sm focus:outline-none placeholder:text-slate-700 w-24"
                    style={{ color: '#edf2ee' }} />
                </div>

                <div className="flex flex-col gap-1 px-5 py-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#89968e' }}>Notas / sensaciones</label>
                  <textarea name="notes" rows={5}
                    placeholder="Qué se entrenó, sensaciones del equipo, notas para el próximo día..."
                    defaultValue={session.notes ?? ''}
                    className="bg-transparent text-sm resize-y focus:outline-none placeholder:text-slate-700 leading-relaxed"
                    style={{ color: '#edf2ee' }} />
                </div>

              </div>
            </div>

            <div className="flex items-center justify-between">
              <DeleteTrainingButton id={session.id} seasonId={seasonId} />
              <button type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
                style={{ backgroundColor: '#72e697', color: '#07140c' }}>
                Guardar cambios
              </button>
            </div>
          </form>

          {/* ── Disponibilidad (respuestas del enlace compartido) ── */}
          {availEnabled && (players?.length ?? 0) > 0 && (
            <AvailabilityCoachCard
              players={players ?? []}
              responses={availResponses.map(r => ({ player_id: r.player_id, status: r.status as 'available' | 'unavailable' | 'doubt' }))}
            />
          )}

          {/* ── Asistencia ── */}
          {(players?.length ?? 0) > 0 && (
            <TrainingAttendance
              sessionId={sessionId}
              seasonId={seasonId}
              players={players ?? []}
              initial={initialAttendance}
            />
          )}

        </div>
      </main>
    </PageTransition>
  )
}
