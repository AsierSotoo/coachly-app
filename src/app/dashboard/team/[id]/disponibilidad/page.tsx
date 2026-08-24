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
    .select('id, name, logo_url, availability_enabled')
    .eq('id', teamId)
    .single()
  if (!team) notFound()

  const isEnabled = (team as { availability_enabled: boolean }).availability_enabled ?? false

  if (!isEnabled) {
    return (
      <PageTransition>
        <main className="max-w-2xl mx-auto px-4 md:px-10 py-8">
          <div className="mb-8">
            <h1 className="text-[28px] font-extrabold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              Disponibilidad
            </h1>
            <p className="text-sm mt-1" style={{ color: '#adb4ce' }}>Confirmación de asistencia por enlace mágico</p>
          </div>

          <div className="rounded-[24px] border p-8 flex flex-col items-center text-center gap-5"
            style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#a78bfa' }}>event_available</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-2">Activa la confirmación de disponibilidad</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#adb4ce' }}>
                Genera un enlace por partido y compártelo con tu grupo de WhatsApp.
                Cada jugadora pulsa su nombre y confirma si puede o no asistir — sin crear cuenta.
              </p>
            </div>
            <div className="w-full flex flex-col gap-2 text-sm text-left" style={{ color: '#64748b' }}>
              {[
                { icon: 'share', text: 'Copia el enlace del partido y pégalo en el grupo' },
                { icon: 'touch_app', text: 'Las jugadoras pulsan su nombre y eligen: Voy / Duda / No puedo' },
                { icon: 'visibility', text: 'El coach ve en tiempo real quién ha confirmado' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-3 px-4 py-2.5 rounded-xl" style={{ backgroundColor: '#151b2d' }}>
                  <span className="material-symbols-outlined mt-0.5 flex-shrink-0" style={{ fontSize: 16, color: '#a78bfa' }}>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <form action={toggleAvailabilityEnabled}>
              <input type="hidden" name="team_id" value={teamId} />
              <input type="hidden" name="enabled" value="true" />
              <button type="submit"
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                style={{ backgroundColor: '#a78bfa', color: 'white' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>toggle_on</span>
                Activar disponibilidad
              </button>
            </form>
          </div>
        </main>
      </PageTransition>
    )
  }

  // Feature activa — cargar partidos con disponibilidad
  const adminClient = createAdminClient()

  // Obtener todas las temporadas del equipo
  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, name')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  const seasonIds = (seasons ?? []).map(s => s.id)

  type MatchRow = {
    id: string; opponent: string; played_at: string; venue: string | null;
    rival_logo_url: string | null; availability_token: string | null; status: string | null;
    season_id: string;
  }

  const { data: matchesRaw } = seasonIds.length
    ? await (adminClient.from('matches') as any)
        .select('id, opponent, played_at, venue, rival_logo_url, availability_token, status, season_id')
        .in('season_id', seasonIds)
        .order('played_at', { ascending: false })
        .limit(30)
    : { data: [] }

  const matches = (matchesRaw ?? []) as MatchRow[]

  // Disponibilidad para todos estos partidos
  const matchIds = matches.map(m => m.id)
  const { data: allAvail } = matchIds.length
    ? await (adminClient.from('match_availability') as any)
        .select('match_id, player_id, status')
        .in('match_id', matchIds)
    : { data: [] }

  type AvailRow = { match_id: string; player_id: string; status: string }
  const availByMatch = new Map<string, AvailRow[]>()
  for (const r of allAvail ?? [] as AvailRow[]) {
    if (!availByMatch.has(r.match_id)) availByMatch.set(r.match_id, [])
    availByMatch.get(r.match_id)!.push(r)
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://coachly-inicio.vercel.app'
  const seasonMap = new Map((seasons ?? []).map(s => [s.id, s.name]))

  // Separar próximos y pasados
  const now = new Date()
  const upcoming = matches.filter(m => new Date(m.played_at) >= now && m.status !== 'finished')
  const recent   = matches.filter(m => new Date(m.played_at) < now || m.status === 'finished').slice(0, 10)

  function MatchAvailCard({ m }: { m: MatchRow }) {
    const avails = availByMatch.get(m.id) ?? []
    const nY = avails.filter(r => r.status === 'available').length
    const nD = avails.filter(r => r.status === 'doubt').length
    const nN = avails.filter(r => r.status === 'unavailable').length
    const total = avails.length
    const token = m.availability_token
    const publicUrl = token ? `${baseUrl}/disponibilidad/${token}` : null
    const matchDate = new Date(m.played_at)
    const dateStr = matchDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
    const timeStr = matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    const seasonName = seasonMap.get(m.season_id) ?? ''

    return (
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: '#1e293b' }}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-white">vs {m.opponent}</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#475569' }}>
              {dateStr} · {timeStr}
              {m.venue ? ` · ${m.venue}` : ''}
              {seasonName ? ` · ${seasonName}` : ''}
            </p>
          </div>
          {publicUrl && <CopyLinkButton url={publicUrl} />}
        </div>
        {total > 0 ? (
          <div className="flex items-center gap-5 px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#4be277', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="text-sm font-bold" style={{ color: '#4be277' }}>{nY}</span>
              <span className="text-[11px]" style={{ color: '#475569' }}>Voy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#fbbf24', fontVariationSettings: "'FILL' 1" }}>help</span>
              <span className="text-sm font-bold" style={{ color: '#fbbf24' }}>{nD}</span>
              <span className="text-[11px]" style={{ color: '#475569' }}>Duda</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#f87171', fontVariationSettings: "'FILL' 1" }}>cancel</span>
              <span className="text-sm font-bold" style={{ color: '#f87171' }}>{nN}</span>
              <span className="text-[11px]" style={{ color: '#475569' }}>No puede</span>
            </div>
            <span className="ml-auto text-[10px]" style={{ color: '#334155' }}>{total} resp.</span>
          </div>
        ) : (
          <div className="px-4 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#334155' }}>hourglass_empty</span>
            <p className="text-[11px]" style={{ color: '#334155' }}>Sin respuestas aún</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <PageTransition>
      <main className="max-w-2xl mx-auto px-4 md:px-10 py-8 pb-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              Disponibilidad
            </h1>
            <p className="text-sm mt-1" style={{ color: '#adb4ce' }}>
              Comparte el enlace de cada partido con tu grupo
            </p>
          </div>
          <form action={toggleAvailabilityEnabled} className="flex-shrink-0 mt-1">
            <input type="hidden" name="team_id" value={teamId} />
            <input type="hidden" name="enabled" value="false" />
            <button type="submit"
              className="text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg transition-all"
              style={{ backgroundColor: '#1e293b', color: '#475569', border: '1px solid #2e3447' }}>
              Desactivar
            </button>
          </form>
        </div>

        {/* Instrucción rápida */}
        <div className="mb-6 rounded-2xl px-4 py-3 flex items-start gap-3"
          style={{ backgroundColor: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.15)' }}>
          <span className="material-symbols-outlined mt-0.5 flex-shrink-0" style={{ fontSize: 18, color: '#a78bfa' }}>info</span>
          <p className="text-xs leading-relaxed" style={{ color: '#adb4ce' }}>
            Pulsa <strong style={{ color: '#dce1fb' }}>Compartir</strong> en cualquier partido para copiar o enviar el enlace.
            Las jugadoras no necesitan cuenta — solo pulsar su nombre y elegir Voy / Duda / No puedo.
          </p>
        </div>

        {/* Próximos partidos */}
        {upcoming.length > 0 && (
          <section className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Próximos partidos</p>
            <div className="flex flex-col gap-3">
              {upcoming.map(m => <MatchAvailCard key={m.id} m={m} />)}
            </div>
          </section>
        )}

        {/* Partidos recientes */}
        {recent.length > 0 && (
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Partidos recientes</p>
            <div className="flex flex-col gap-3">
              {recent.map(m => <MatchAvailCard key={m.id} m={m} />)}
            </div>
          </section>
        )}

        {matches.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#1e293b' }}>sports_soccer</span>
            <p className="mt-4 text-sm" style={{ color: '#475569' }}>No hay partidos registrados todavía</p>
            <Link href={`/dashboard/team/${teamId}/seasons`}
              className="inline-flex mt-3 items-center gap-1 text-sm"
              style={{ color: '#a78bfa' }}>
              Crear temporada
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
            </Link>
          </div>
        )}

        {/* Settings footer */}
        <div className="mt-8 text-center">
          <Link href={`/dashboard/team/${teamId}/settings`}
            className="text-xs hover:underline" style={{ color: '#334155' }}>
            Ajustes del equipo
          </Link>
        </div>
      </main>
    </PageTransition>
  )
}
