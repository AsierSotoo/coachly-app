import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { PageTransition } from '@/components/ui/page-transition'
import { ConvocatoriaEditor } from '@/components/convocatoria/convocatoria-editor'
import { updateConvocatoriaDetails } from '../actions'
import type { ConvocatoriaStatus } from '../actions'
import { TeamLogo } from '@/components/team/team-logo'

export default async function ConvocatoriaDetailPage({
  params,
}: {
  params: Promise<{ id: string; convocatoriaId: string }>
}) {
  const { id: seasonId, convocatoriaId } = await params
  const supabase = await createClient()

  const { data: conv } = await supabase
    .from('convocatorias')
    .select('*, seasons(*, teams(*))')
    .eq('id', convocatoriaId)
    .single()

  if (!conv) notFound()

  const season = conv.seasons as { id: string; name: string; teams: { id: string; name: string; logo_url?: string | null; gender?: string | null } }
  const team = season.teams

  const [{ data: players }, { data: existing }, { data: matches }] = await Promise.all([
    supabase.from('players').select('*').eq('team_id', team.id).eq('active', true)
      .order('number', { ascending: true, nullsFirst: false }),
    supabase.from('convocatoria_players').select('player_id, status').eq('convocatoria_id', convocatoriaId),
    supabase.from('matches')
      .select('id, opponent, played_at, match_time, home, convocatorias(id)')
      .eq('season_id', seasonId)
      .order('played_at', { ascending: false }),
  ])

  const initial: Record<string, ConvocatoriaStatus> = {}
  for (const row of existing ?? []) {
    initial[row.player_id] = row.status as ConvocatoriaStatus
  }

  // Tarjetas amarillas acumuladas en la temporada por jugadora
  const matchIds = (matches ?? []).map(m => m.id)
  const { data: cardData } = matchIds.length > 0
    ? await supabase.from('appearances').select('player_id, yellow_cards').in('match_id', matchIds).gt('yellow_cards', 0)
    : { data: [] as Array<{ player_id: string; yellow_cards: number }> }

  const yellowCards: Record<string, number> = {}
  for (const row of cardData ?? []) {
    yellowCards[row.player_id] = (yellowCards[row.player_id] ?? 0) + (row.yellow_cards ?? 0)
  }

  const availableMatches = (matches ?? []).filter(m => {
    const linked = m.convocatorias as { id: string }[]
    return linked.length === 0 || linked.some(c => c.id === convocatoriaId)
  }).map(m => ({ id: m.id, opponent: m.opponent, played_at: m.played_at, match_time: (m as { match_time?: string | null }).match_time ?? null }))

  const linkedMatch = (matches ?? []).find(m => m.id === conv.match_id) as { home?: boolean; match_time?: string | null } | undefined
  const isHome = linkedMatch?.home ?? null

  const isCompleted = (existing ?? []).some(r => r.status !== 'no_convocada')

  return (
    <PageTransition>
      <main className="max-w-7xl mx-auto px-4 md:px-10 py-8 pb-32 md:pb-10">

        {/* ── Breadcrumb ────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest mb-6" style={{ color: '#adb4ce' }}>
          <Link href={`/dashboard/season/${seasonId}`} className="hover:text-white transition-colors">Temporada</Link>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
          <Link href={`/dashboard/season/${seasonId}/convocatorias`} className="hover:text-white transition-colors">Convocatorias</Link>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
          <span className="text-white">vs {conv.opponent}</span>
        </div>

        {/* ── Match Header Card ────────────────────────────────────── */}
        <section
          className="relative overflow-hidden rounded-2xl border p-6 mb-8 flex flex-wrap lg:flex-nowrap items-center justify-between gap-6"
          style={{ backgroundColor: '#191f31', borderColor: '#2e3447' }}
        >
          {/* Status badge */}
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border"
              style={isCompleted
                ? { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#4be277' }
                : { backgroundColor: '#2e3447', borderColor: '#3d4a3d', color: '#adb4ce' }}>
              <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-green-400' : 'animate-pulse'}`}
                style={{ backgroundColor: isCompleted ? '#4be277' : '#adb4ce' }} />
              {isCompleted ? 'COMPLETADA' : 'PENDIENTE'}
            </span>
          </div>

          {/* Teams */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="text-right">
                <h2 className="text-[24px] font-extrabold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{team.name}</h2>
                <p className="text-[11px] font-bold uppercase tracking-wider mt-0.5" style={{ color: '#adb4ce' }}>
                  {isHome === true ? 'Local' : isHome === false ? 'Visitante' : 'Local'}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center border overflow-hidden"
                style={{ backgroundColor: '#23293c', borderColor: '#2e3447' }}>
                <TeamLogo name={team.name} logoUrl={team.logo_url} size="lg" />
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>vs</span>
              <div className="h-px w-10 mt-1" style={{ backgroundColor: '#2e3447' }} />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center border text-xl font-black"
                style={{ backgroundColor: '#23293c', borderColor: '#2e3447', color: '#4be277', fontFamily: 'Sora, sans-serif' }}>
                {conv.opponent.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-[24px] font-extrabold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{conv.opponent}</h2>
                <p className="text-[11px] font-bold uppercase tracking-wider mt-0.5" style={{ color: '#adb4ce' }}>
                  {isHome === false ? 'Local' : isHome === true ? 'Visitante' : 'Visitante'}
                </p>
              </div>
            </div>
          </div>

          {/* Match metadata */}
          <div className="flex flex-wrap gap-6 pr-10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: '#4be277', fontSize: 20 }}>calendar_month</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>Fecha</p>
                <p className="text-sm font-semibold text-white">
                  {new Date(conv.played_at + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            {linkedMatch?.match_time && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ color: '#4be277', fontSize: 20 }}>sports_soccer</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>Hora partido</p>
                  <p className="text-sm font-semibold text-white">{linkedMatch.match_time.slice(0, 5)} h</p>
                </div>
              </div>
            )}
            {(conv as any).meeting_time && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ color: '#4be277', fontSize: 20 }}>schedule</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>Convocatoria</p>
                  <p className="text-sm font-semibold text-white">{(conv as any).meeting_time} h</p>
                </div>
              </div>
            )}
            {(conv as any).location && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ color: '#4be277', fontSize: 20 }}>location_on</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>Lugar</p>
                  <p className="text-sm font-semibold text-white">{(conv as any).location}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: '#4be277', fontSize: 20 }}>sports_soccer</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>Temporada</p>
                <p className="text-sm font-semibold text-white">{season.name}</p>
              </div>
            </div>
          </div>

          {/* Editar datos (inline form) */}
          <form action={updateConvocatoriaDetails} className="hidden">
            <input type="hidden" name="id" value={convocatoriaId} />
            <input type="hidden" name="season_id" value={seasonId} />
            <input type="hidden" name="opponent" value={conv.opponent} />
            <input type="hidden" name="played_at" value={conv.played_at} />
          </form>
        </section>

        {/* ── Editor ───────────────────────────────────────────────── */}
        <ConvocatoriaEditor
          convocatoriaId={convocatoriaId}
          seasonId={seasonId}
          opponent={conv.opponent}
          playedAt={conv.played_at}
          teamName={team.name}
          teamGender={team.gender}
          logoUrl={team.logo_url}
          seasonName={season.name}
          players={players ?? []}
          initial={initial}
          yellowCards={yellowCards}
          linkedMatchId={conv.match_id ?? null}
          availableMatches={availableMatches}
          meetingTime={(conv as any).meeting_time ?? null}
          location={(conv as any).location ?? null}
        />

      </main>
    </PageTransition>
  )
}
