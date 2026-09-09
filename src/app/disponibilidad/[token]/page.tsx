import type { Metadata } from 'next'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { AvailabilityClient } from '@/components/disponibilidad/availability-client'

function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export const dynamic = 'force-dynamic'

type EventInfo =
  | { type: 'match';    id: string; title: string; date: string; subtitle: string; teamId: string; teamName: string; teamLogo: string | null; rivalLogo: string | null }
  | { type: 'training'; id: string; title: string; date: string; subtitle: string; teamId: string; teamName: string; teamLogo: string | null; rivalLogo: null }

async function resolveEvent(token: string): Promise<EventInfo | null> {
  const supabase = createPublicClient()

  const { data: match } = await (supabase.from('matches') as any)
    .select('id, opponent, rival_logo_url, played_at, match_time, venue, seasons(team_id, teams(id, name, logo_url, availability_enabled))')
    .eq('availability_token', token)
    .maybeSingle()

  if (match) {
    const team = (match.seasons as any).teams as { id: string; name: string; logo_url: string | null; availability_enabled: boolean }
    if (!team.availability_enabled) return null
    const d = new Date(match.played_at + 'T12:00:00')
    const timeStr = match.match_time ? (match.match_time as string).slice(0, 5) + 'h' : null
    return {
      type: 'match', id: match.id,
      title: `vs ${match.opponent}`,
      date: d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
      subtitle: [timeStr, match.venue].filter(Boolean).join(' · '),
      teamId: team.id, teamName: team.name, teamLogo: team.logo_url,
      rivalLogo: match.rival_logo_url,
    }
  }

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

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params
  const ev = await resolveEvent(token)

  const ogImage = 'https://coachly-inicio.vercel.app/icons/icon-512.png'

  if (!ev) {
    return {
      title: 'Disponibilidad · Coachly',
      openGraph: { images: [{ url: ogImage, width: 512, height: 512 }] },
    }
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
      images: [{ url: ogImage, width: 512, height: 512 }],
    },
    twitter: { card: 'summary', title, description, images: [ogImage] },
  }
}

export default async function PublicAvailabilityPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const eventInfo = await resolveEvent(token)

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

  const { data: players } = await supabase
    .from('players')
    .select('id, name, number, position')
    .eq('team_id', eventInfo.teamId)
    .eq('active', true)
    .order('number', { ascending: true, nullsFirst: false })

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

  return (
    <AvailabilityClient
      token={token}
      eventType={eventInfo.type}
      eventId={eventInfo.id}
      teamId={eventInfo.teamId}
      teamName={eventInfo.teamName}
      teamLogo={eventInfo.teamLogo}
      eventTitle={eventInfo.title}
      eventDate={eventInfo.date}
      eventSubtitle={eventInfo.subtitle}
      rivalLogo={eventInfo.rivalLogo}
      players={(players ?? []).map(p => ({
        id: p.id,
        name: p.name,
        number: p.number,
        position: p.position,
      }))}
      initialAvail={availRows.map(r => ({
        playerId: r.player_id,
        status: r.status as 'available' | 'unavailable' | 'doubt',
      }))}
    />
  )
}
