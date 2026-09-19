import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { PageTransition } from '@/components/ui/page-transition'
import { CopyLinkButton } from '@/components/disponibilidad/copy-link-button'
import { toggleAvailabilityEnabled } from '../../actions'
import Link from 'next/link'

export default async function DisponibilidadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: teamId } = await params
  const supabase = await createClient()

  const { data: team } = await (supabase.from('teams') as any)
    .select('id, name, availability_enabled')
    .eq('id', teamId)
    .single()
  if (!team) notFound()

  const isEnabled = (team as { availability_enabled: boolean }).availability_enabled ?? false

  // ── Feature desactivada ──────────────────────────────────────────────────
  if (!isEnabled) {
    return (
      <PageTransition>
        <main className="max-w-2xl mx-auto px-4 md:px-10 py-8 pb-32 md:pb-10">
          <div className="mb-8">
            <h1 className="text-[28px] font-extrabold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--tx)' }}>
              Disponibilidad
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--tx-2)' }}>Confirmación de asistencia por enlace mágico</p>
          </div>

          <div className="rounded-2xl border p-8 flex flex-col items-center text-center gap-5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#a78bfa' }}>event_available</span>
            </div>
            <div>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--tx)' }}>Activa la confirmación de disponibilidad</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--tx-2)' }}>
                Genera un enlace por partido o entrenamiento y compártelo con tu grupo de WhatsApp.
                Cada jugadora pulsa su nombre y confirma si puede asistir — sin crear cuenta.
              </p>
            </div>
            <div className="w-full flex flex-col gap-2 text-sm text-left" style={{ color: 'var(--tx-3)' }}>
              {[
                { icon: 'sports_soccer', text: 'Funciona para partidos y entrenamientos' },
                { icon: 'share',         text: 'Copia el enlace y pégalo en el grupo de WhatsApp' },
                { icon: 'touch_app',     text: 'Las jugadoras eligen: Voy / Duda / No puedo' },
                { icon: 'visibility',    text: 'El coach ve en tiempo real quién ha confirmado' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 16, color: '#a78bfa' }}>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <form action={toggleAvailabilityEnabled}>
              <input type="hidden" name="team_id" value={teamId} />
              <input type="hidden" name="enabled"  value="true" />
              <button type="submit"
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                style={{ backgroundColor: '#a78bfa', color: 'white' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>toggle_on</span>
                Activar disponibilidad
              </button>
            </form>
            <p className="text-xs" style={{ color: 'var(--bdr-strong)' }}>
              También puedes activarlo desde{' '}
              <Link href={`/dashboard/team/${teamId}/settings`} className="underline" style={{ color: 'var(--tx-3)' }}>
                Ajustes del equipo
              </Link>
            </p>
          </div>
        </main>
      </PageTransition>
    )
  }

  // ── Feature activa ───────────────────────────────────────────────────────
  const adminClient = createAdminClient()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://coachly-inicio.vercel.app'

  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, name')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
  const seasonIds = (seasons ?? []).map(s => s.id)
  const seasonMap = new Map((seasons ?? []).map(s => [s.id, s.name]))

  type MatchRow = { id: string; opponent: string; played_at: string; rival_logo_url: string | null; availability_token: string | null; status: string | null; season_id: string }
  const { data: matchesRaw } = seasonIds.length
    ? await (adminClient.from('matches') as any)
        .select('id, opponent, played_at, rival_logo_url, availability_token, status, season_id')
        .in('season_id', seasonIds)
        .order('played_at', { ascending: false })
        .limit(30)
    : { data: [] }

  type SessionRow = { id: string; date: string; title: string | null; availability_token: string | null; season_id: string }
  const { data: sessionsRaw } = seasonIds.length
    ? await (adminClient.from('training_sessions') as any)
        .select('id, date, title, availability_token, season_id')
        .in('season_id', seasonIds)
        .order('date', { ascending: false })
        .limit(30)
    : { data: [] }

  const matches  = (matchesRaw  ?? []) as MatchRow[]
  const sessions = (sessionsRaw ?? []) as SessionRow[]

  const matchIds = matches.map(m => m.id)
  const { data: matchAvail } = matchIds.length
    ? await (adminClient.from('match_availability') as any).select('match_id, status').in('match_id', matchIds)
    : { data: [] }

  const sessionIds2 = sessions.map(s => s.id)
  const { data: trainAvail } = sessionIds2.length
    ? await (adminClient.from('training_availability') as any).select('session_id, status').in('session_id', sessionIds2)
    : { data: [] }

  type CountMap = Map<string, { y: number; d: number; n: number }>
  const matchCounts: CountMap = new Map()
  for (const r of matchAvail ?? [] as { match_id: string; status: string }[]) {
    if (!matchCounts.has(r.match_id)) matchCounts.set(r.match_id, { y: 0, d: 0, n: 0 })
    const c = matchCounts.get(r.match_id)!
    if (r.status === 'available') c.y++
    else if (r.status === 'doubt') c.d++
    else c.n++
  }
  const trainCounts: CountMap = new Map()
  for (const r of trainAvail ?? [] as { session_id: string; status: string }[]) {
    if (!trainCounts.has(r.session_id)) trainCounts.set(r.session_id, { y: 0, d: 0, n: 0 })
    const c = trainCounts.get(r.session_id)!
    if (r.status === 'available') c.y++
    else if (r.status === 'doubt') c.d++
    else c.n++
  }

  type Event = {
    key: string; type: 'match' | 'training'; dateMs: number;
    label: string; sublabel: string; token: string | null; seasonName: string
    counts: { y: number; d: number; n: number }
  }

  const events: Event[] = [
    ...matches.map(m => ({
      key: `m-${m.id}`, type: 'match' as const,
      dateMs: new Date(m.played_at + 'T12:00:00').getTime(),
      label: `vs ${m.opponent}`,
      sublabel: new Date(m.played_at + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
      token: m.availability_token,
      seasonName: seasonMap.get(m.season_id) ?? '',
      counts: matchCounts.get(m.id) ?? { y: 0, d: 0, n: 0 },
    })),
    ...sessions.map(s => ({
      key: `t-${s.id}`, type: 'training' as const,
      dateMs: new Date(s.date + 'T12:00:00').getTime(),
      label: s.title || 'Entrenamiento',
      sublabel: new Date(s.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
      token: s.availability_token,
      seasonName: seasonMap.get(s.season_id) ?? '',
      counts: trainCounts.get(s.id) ?? { y: 0, d: 0, n: 0 },
    })),
  ].sort((a, b) => b.dateMs - a.dateMs)

  const now = Date.now()
  const upcoming = events.filter(e => e.dateMs >= now)
  const recent   = events.filter(e => e.dateMs <  now).slice(0, 12)

  function EventCard({ ev }: { ev: Event }) {
    const publicUrl = ev.token ? `${baseUrl}/disponibilidad/${ev.token}` : null
    const total = ev.counts.y + ev.counts.d + ev.counts.n
    const isMatch = ev.type === 'match'
    return (
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--bdr-strong)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: isMatch ? 'rgba(75,226,119,0.1)' : 'rgba(251,191,36,0.1)',
              border: `1px solid ${isMatch ? 'rgba(75,226,119,0.2)' : 'rgba(251,191,36,0.2)'}`,
            }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: isMatch ? '#72e697' : '#fbbf24', fontVariationSettings: "'FILL' 1" }}>
              {isMatch ? 'sports_soccer' : 'fitness_center'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: 'var(--tx)' }}>{ev.label}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--tx-3)' }}>
              {ev.sublabel}{ev.seasonName ? ` · ${ev.seasonName}` : ''}
            </p>
          </div>
          {publicUrl && <CopyLinkButton url={publicUrl} />}
        </div>
        {total > 0 ? (
          <div className="flex items-center gap-5 px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#72e697', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="text-sm font-bold" style={{ color: '#72e697' }}>{ev.counts.y}</span>
              <span className="text-[10px]" style={{ color: 'var(--tx-3)' }}>Voy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#fbbf24', fontVariationSettings: "'FILL' 1" }}>help</span>
              <span className="text-sm font-bold" style={{ color: '#fbbf24' }}>{ev.counts.d}</span>
              <span className="text-[10px]" style={{ color: 'var(--tx-3)' }}>Duda</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#f87171', fontVariationSettings: "'FILL' 1" }}>cancel</span>
              <span className="text-sm font-bold" style={{ color: '#f87171' }}>{ev.counts.n}</span>
              <span className="text-[10px]" style={{ color: 'var(--tx-3)' }}>No puede</span>
            </div>
            <span className="ml-auto text-[10px]" style={{ color: 'var(--bdr-strong)' }}>{total} resp.</span>
          </div>
        ) : (
          <div className="px-4 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--bdr-strong)' }}>hourglass_empty</span>
            <p className="text-[11px]" style={{ color: 'var(--bdr-strong)' }}>Sin respuestas aún</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <PageTransition>
      <main className="max-w-2xl mx-auto px-4 md:px-10 py-8 pb-32 md:pb-10">

        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--tx)' }}>
              Disponibilidad
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--tx-2)' }}>
              Partidos y entrenamientos · Comparte el enlace con tu grupo
            </p>
          </div>
          <form action={toggleAvailabilityEnabled} className="flex-shrink-0 mt-1">
            <input type="hidden" name="team_id" value={teamId} />
            <input type="hidden" name="enabled"  value="false" />
            <button type="submit"
              className="text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: 'var(--bdr-strong)', color: 'var(--tx-3)', border: '1px solid var(--bdr-strong)' }}>
              Desactivar
            </button>
          </form>
        </div>

        {/* Tip */}
        <div className="mb-6 rounded-2xl px-4 py-3 flex items-start gap-3"
          style={{ backgroundColor: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.15)' }}>
          <span className="material-symbols-outlined mt-0.5 flex-shrink-0" style={{ fontSize: 16, color: '#a78bfa' }}>info</span>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--tx-2)' }}>
            Pulsa <strong style={{ color: 'var(--tx)' }}>Compartir</strong> en cualquier evento para enviar el enlace.
            Las jugadoras confirman sin crear cuenta.
          </p>
        </div>

        {upcoming.length > 0 && (
          <section className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--tx-3)' }}>Próximos</p>
            <div className="flex flex-col gap-3">
              {upcoming.map(ev => <EventCard key={ev.key} ev={ev} />)}
            </div>
          </section>
        )}

        {recent.length > 0 && (
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--tx-3)' }}>Recientes</p>
            <div className="flex flex-col gap-3">
              {recent.map(ev => <EventCard key={ev.key} ev={ev} />)}
            </div>
          </section>
        )}

        {events.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--bdr-strong)' }}>event</span>
            <p className="mt-4 text-sm" style={{ color: 'var(--tx-3)' }}>No hay partidos ni entrenamientos todavía</p>
          </div>
        )}
      </main>
    </PageTransition>
  )
}
