import type { Metadata } from 'next'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { setPublicAvailabilityForm } from '@/lib/public-availability-actions'
import Image from 'next/image'

// Cliente anónimo — usa las RLS públicas, no necesita service role key
function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export const dynamic = 'force-dynamic'

const STATUS_CONFIG = {
  available:   { label: 'Voy',      icon: 'check_circle', color: '#4be277', bg: 'rgba(75,226,119,0.15)',  border: 'rgba(75,226,119,0.4)' },
  doubt:       { label: 'Duda',     icon: 'help',         color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.4)' },
  unavailable: { label: 'No puedo', icon: 'cancel',       color: '#f87171', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.4)' },
} as const

type EventInfo =
  | { type: 'match';    id: string; title: string; date: string; subtitle: string; teamId: string; teamName: string; teamLogo: string | null; rivalLogo: string | null }
  | { type: 'training'; id: string; title: string; date: string; subtitle: string; teamId: string; teamName: string; teamLogo: string | null; rivalLogo: null }

async function resolveEvent(token: string): Promise<EventInfo | null> {
  const supabase = createPublicClient()

  // Buscar en partidos
  const { data: match } = await (supabase.from('matches') as any)
    .select('id, opponent, rival_logo_url, played_at, venue, seasons(team_id, teams(id, name, logo_url, availability_enabled))')
    .eq('availability_token', token)
    .maybeSingle()

  if (match) {
    const team = (match.seasons as any).teams as { id: string; name: string; logo_url: string | null; availability_enabled: boolean }
    if (!team.availability_enabled) return null
    const d = new Date(match.played_at)
    return {
      type: 'match', id: match.id,
      title: `vs ${match.opponent}`,
      date: d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
      subtitle: `${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}${match.venue ? ` · ${match.venue}` : ''}`,
      teamId: team.id, teamName: team.name, teamLogo: team.logo_url,
      rivalLogo: match.rival_logo_url,
    }
  }

  // Buscar en entrenamientos
  const { data: session } = await (supabase.from('training_sessions') as any)
    .select('id, date, title, notes, teams(id, name, logo_url, availability_enabled)')
    .eq('availability_token', token)
    .maybeSingle()

  if (session) {
    const team = session.teams as { id: string; name: string; logo_url: string | null; availability_enabled: boolean }
    if (!team.availability_enabled) return null
    const d = new Date(session.date)
    return {
      type: 'training', id: session.id,
      title: session.title || 'Entrenamiento',
      date: d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
      subtitle: session.notes ? (session.notes as string).slice(0, 80) : '',
      teamId: team.id, teamName: team.name, teamLogo: team.logo_url,
      rivalLogo: null,
    }
  }

  return null
}

// Open Graph metadata para WhatsApp y otras apps
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params
  const ev = await resolveEvent(token)

  if (!ev) {
    return { title: 'Disponibilidad · Coachly' }
  }

  const emoji = ev.type === 'match' ? '⚽' : '🏃'
  const title = `${emoji} ${ev.title} · ${ev.date}`
  const description = `${ev.teamName} · Confirma si puedes asistir`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'Coachly',
      type: 'website',
      images: [{ url: 'https://coachly-inicio.vercel.app/icons/icon-512.png', width: 512, height: 512 }],
    },
    twitter: { card: 'summary', title, description, images: ['https://coachly-inicio.vercel.app/icons/icon-512.png'] },
  }
}

export default async function PublicAvailabilityPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const eventInfo = await resolveEvent(token)

  // Enlace inválido o feature desactivada — página amigable sin redirect
  if (!eventInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ backgroundColor: '#080d1e', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ backgroundColor: '#1e293b' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#475569' }}>link_off</span>
        </div>
        <h1 className="text-lg font-bold text-white mb-2 text-center">Enlace no válido</h1>
        <p className="text-sm text-center leading-relaxed" style={{ color: '#64748b', maxWidth: 280 }}>
          Este enlace no existe o la confirmación de asistencia está desactivada para este equipo.
        </p>
      </div>
    )
  }

  const supabase = createPublicClient()

  // Jugadoras activas del equipo
  const { data: players } = await supabase
    .from('players')
    .select('id, name, number, position')
    .eq('team_id', eventInfo.teamId)
    .eq('active', true)
    .order('number', { ascending: true, nullsFirst: false })

  // Disponibilidad actual
  let availRows: { player_id: string; status: string }[] = []
  if (eventInfo.type === 'match') {
    const { data } = await (supabase.from('match_availability') as any)
      .select('player_id, status').eq('match_id', eventInfo.id)
    availRows = data ?? []
  } else {
    const { data } = await (supabase.from('training_availability') as any)
      .select('player_id, status').eq('session_id', eventInfo.id)
    availRows = data ?? []
  }

  const availMap  = new Map(availRows.map(r => [r.player_id, r.status as keyof typeof STATUS_CONFIG]))
  const nAvail    = availRows.filter(r => r.status === 'available').length
  const nDoubt    = availRows.filter(r => r.status === 'doubt').length
  const nUnavail  = availRows.filter(r => r.status === 'unavailable').length
  const isMatch   = eventInfo.type === 'match'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080d1e', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3"
        style={{ backgroundColor: '#0c1324', borderColor: '#1e293b' }}>
        {eventInfo.teamLogo
          ? <Image src={eventInfo.teamLogo} alt={eventInfo.teamName} width={32} height={32} className="rounded-lg object-contain" unoptimized />
          : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
              style={{ backgroundColor: '#1e293b', color: '#4be277' }}>
              {eventInfo.teamName.charAt(0)}
            </div>
        }
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: '#adb4ce' }}>{eventInfo.teamName}</p>
          <p className="text-[10px]" style={{ color: '#475569' }}>
            {isMatch ? 'Partido' : 'Entrenamiento'} · Confirma tu asistencia
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          <span style={{ color: '#4be277' }}>{nAvail}✓</span>
          <span style={{ color: '#fbbf24' }}>{nDoubt}?</span>
          <span style={{ color: '#f87171' }}>{nUnavail}✗</span>
        </div>
      </div>

      {/* Cabecera del evento */}
      <div className="px-4 pt-6 pb-4">
        {isMatch ? (
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-1.5">
              {eventInfo.teamLogo
                ? <Image src={eventInfo.teamLogo} alt={eventInfo.teamName} width={56} height={56} className="rounded-xl object-contain" unoptimized />
                : <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black"
                    style={{ backgroundColor: '#1e293b', color: '#4be277' }}>{eventInfo.teamName.charAt(0)}</div>
              }
              <p className="text-[11px] font-semibold text-center max-w-[80px] leading-tight" style={{ color: '#adb4ce' }}>{eventInfo.teamName}</p>
            </div>
            <span className="text-[13px] font-black" style={{ color: '#475569' }}>VS</span>
            <div className="flex flex-col items-center gap-1.5">
              {eventInfo.rivalLogo
                ? <Image src={eventInfo.rivalLogo} alt={eventInfo.title} width={56} height={56} className="rounded-xl object-contain" unoptimized />
                : <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black"
                    style={{ backgroundColor: '#1e293b', color: '#adb4ce' }}>
                    {eventInfo.title.replace('vs ', '').charAt(0)}
                  </div>
              }
              <p className="text-[11px] font-semibold text-center max-w-[80px] leading-tight" style={{ color: '#adb4ce' }}>
                {eventInfo.title.replace('vs ', '')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#fbbf24', fontVariationSettings: "'FILL' 1" }}>
                fitness_center
              </span>
            </div>
            <p className="text-lg font-bold text-white">{eventInfo.title}</p>
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-sm font-semibold capitalize" style={{ color: '#dce1fb' }}>{eventInfo.date}</p>
          {eventInfo.subtitle && (
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{eventInfo.subtitle}</p>
          )}
        </div>
      </div>

      <div className="px-4 pb-3">
        <p className="text-center text-sm" style={{ color: '#64748b' }}>Pulsa tu nombre y confirma si vas</p>
      </div>

      {/* Lista de jugadoras */}
      <div className="px-3 pb-8 flex flex-col gap-2">
        {(players ?? []).map(p => {
          const currentStatus = availMap.get(p.id)
          const cfg = currentStatus ? STATUS_CONFIG[currentStatus] : null
          return (
            <div key={p.id} className="rounded-2xl border overflow-hidden"
              style={{ backgroundColor: '#0f172a', borderColor: cfg ? cfg.border : '#1e293b' }}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ backgroundColor: '#1e293b', color: '#adb4ce' }}>
                  {p.number ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#dce1fb' }}>{p.name}</p>
                  {p.position && <p className="text-[10px]" style={{ color: '#475569' }}>{p.position}</p>}
                </div>
                {cfg && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                    {cfg.label}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 border-t" style={{ borderColor: '#1e293b' }}>
                {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, s]) => {
                  const active = currentStatus === key
                  return (
                    <form key={key} action={setPublicAvailabilityForm}>
                      <input type="hidden" name="event_type" value={eventInfo!.type} />
                      <input type="hidden" name="event_id"   value={eventInfo!.id} />
                      <input type="hidden" name="player_id"  value={p.id} />
                      <input type="hidden" name="status"     value={key} />
                      <input type="hidden" name="token"      value={token} />
                      <button type="submit"
                        className="w-full flex flex-col items-center gap-0.5 py-2.5 transition-all active:scale-95"
                        style={{ backgroundColor: active ? s.bg : 'transparent', color: active ? s.color : '#475569' }}>
                        <span className="material-symbols-outlined"
                          style={{ fontSize: 18, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                          {s.icon}
                        </span>
                        <span className="text-[10px] font-semibold">{s.label}</span>
                      </button>
                    </form>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-center pb-8">
        <p className="text-[10px]" style={{ color: '#334155' }}>Gestión de equipos con Coachly</p>
      </div>
    </div>
  )
}
