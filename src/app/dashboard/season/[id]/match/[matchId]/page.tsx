import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { MatchForm } from '@/components/match/match-form'
import { RivalLogoUpload } from '@/components/match/rival-logo-upload'
import { MatchShareCard } from '@/components/match/match-share-card'
import { DeleteMatchButton } from '@/components/match/delete-match-button'
import { AvailabilityPicker } from '@/components/match/availability-picker'
import { AvailabilityCoachCard } from '@/components/disponibilidad/availability-coach-card'
import { PageTransition } from '@/components/ui/page-transition'
import { getFormation } from '@/lib/formations'
import { ShareWhatsAppButton } from '@/components/match/share-whatsapp-button'
import { MatchPrintSheet } from '@/components/match/match-print-sheet'
import Link from 'next/link'

export default async function MatchPage({
  params, searchParams,
}: {
  params: Promise<{ id: string; matchId: string }>
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const { id: seasonId, matchId } = await params
  const supabase = await createClient()

  // Primera ronda: todo lo que no depende de team.id en paralelo
  const [
    { data: match },
    { data: season },
    { data: appearances },
    { data: convocatoria },
    { data: allMatches },
    { data: availRows },
  ] = await Promise.all([
    supabase.from('matches').select('*').eq('id', matchId).single(),
    supabase.from('seasons').select('*, teams(*)').eq('id', seasonId).single(),
    supabase.from('appearances').select('*').eq('match_id', matchId),
    supabase.from('convocatorias')
      .select('id, convocatoria_players(player_id, status)')
      .eq('match_id', matchId)
      .maybeSingle(),
    supabase.from('matches')
      .select('id, opponent, played_at')
      .eq('season_id', seasonId)
      .order('played_at', { ascending: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('match_availability') as any).select('player_id, status').eq('match_id', matchId),
  ])
  if (!match || !season) notFound()

  const team = season.teams as { id: string; name: string; gender?: string | null; availability_enabled?: boolean; logo_url?: string | null }

  const isScheduledEarly = (match as { status?: string }).status === 'scheduled'

  // Segunda ronda: players necesita team.id
  const { data: players } = await supabase.from('players').select('*').eq('team_id', team.id).eq('active', true)
    .order('number', { ascending: true, nullsFirst: false })

  const matchIndex = allMatches?.findIndex(m => m.id === matchId) ?? -1
  const prevMatch  = matchIndex > 0 ? allMatches![matchIndex - 1] : null
  const nextMatch  = matchIndex < (allMatches?.length ?? 0) - 1 ? allMatches![matchIndex + 1] : null

  const convocatoriaStatuses: Record<string, 'titular' | 'convocada' | 'no_convocada'> = {}
  const convocatoriaId = (convocatoria as { id?: string } | null)?.id ?? null
  if (convocatoria) {
    const rows = convocatoria.convocatoria_players as { player_id: string; status: string }[]
    for (const r of rows ?? []) {
      convocatoriaStatuses[r.player_id] = r.status as 'titular' | 'convocada' | 'no_convocada'
    }
  }

  // Si hay convocatoria, reordenar: titulares → convocadas → no_convocadas → sin asignar
  const STATUS_ORDER = { titular: 0, convocada: 1, no_convocada: 2 }
  const sortedPlayers = [...(players ?? [])].sort((a, b) => {
    const aS = STATUS_ORDER[convocatoriaStatuses[a.id] ?? 'no_convocada'] ?? 2
    const bS = STATUS_ORDER[convocatoriaStatuses[b.id] ?? 'no_convocada'] ?? 2
    if (aS !== bS) return aS - bS
    return (a.number ?? 99) - (b.number ?? 99)
  })

  const sp = await searchParams
  const isScheduled = isScheduledEarly

  const initialAvailability: Record<string, 'available' | 'unavailable' | 'doubt' | null> = {}
  for (const row of (availRows as { player_id: string; status: string }[] | null) ?? []) {
    initialAvailability[row.player_id] = row.status as 'available' | 'unavailable' | 'doubt'
  }

  const playerMap = new Map((players ?? []).map(p => [p.id, p] as [string, typeof p]))
  const scorerApps = (appearances ?? []).filter(a => (a.goals ?? 0) > 0).sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))
  const yellowApps = (appearances ?? []).filter(a => (a.yellow_cards ?? 0) > 0)
  const redApps    = (appearances ?? []).filter(a => (a.red_cards ?? 0) > 0)
  const mvpId      = (match as { mvp_player_id?: string | null }).mvp_player_id
  const mvpPlayer  = mvpId ? playerMap.get(mvpId) : null
  const matchNotes = (match as { notes?: string | null }).notes ?? null
  const hasSummary = scorerApps.length > 0 || yellowApps.length > 0 || redApps.length > 0 || !!mvpPlayer

  // Once inicial: agrupa titulares por línea táctica según su posición
  type StarterInfo = { id: string; name: string; number: number | null; position: string | null; goals: number; yellow: number; red: number; isMvp: boolean }
  function posLine(pos: string | null): 'gk' | 'def' | 'mid' | 'fwd' {
    const p = (pos ?? '').toLowerCase()
    if (p.includes('port')) return 'gk'
    if (p.includes('def')) return 'def'
    if (p.includes('centro') || p.includes('medio') || p.includes('campist') || p.includes('mid')) return 'mid'
    return 'fwd'
  }
  const starterList: StarterInfo[] = (appearances ?? [])
    .filter(a => a.starter && (a.minutes ?? 0) > 0)
    .map(a => {
      const p = playerMap.get(a.player_id)
      if (!p) return null
      return { id: p.id, name: p.name, number: p.number, position: p.position, goals: a.goals ?? 0, yellow: a.yellow_cards ?? 0, red: a.red_cards ?? 0, isMvp: p.id === mvpId }
    })
    .filter((x): x is StarterInfo => x !== null)
  const subList: StarterInfo[] = (appearances ?? [])
    .filter(a => !a.starter && (a.minutes ?? 0) > 0)
    .map(a => {
      const p = playerMap.get(a.player_id)
      if (!p) return null
      return { id: p.id, name: p.name, number: p.number, position: p.position, goals: a.goals ?? 0, yellow: a.yellow_cards ?? 0, red: a.red_cards ?? 0, isMvp: p.id === mvpId }
    })
    .filter((x): x is StarterInfo => x !== null)
  const gkLine  = starterList.filter(p => posLine(p.position) === 'gk')
  const defLine = starterList.filter(p => posLine(p.position) === 'def')
  const midLine = starterList.filter(p => posLine(p.position) === 'mid')
  const fwdLine = starterList.filter(p => posLine(p.position) === 'fwd')
  const showLineup = !isScheduled && starterList.length > 0

  // Sustituciones: emparejar por minuto (titular que sale ↔ suplente que entra)
  type SubEvent = { minute: number; out: string | null; in: string | null }
  const subMap = new Map<number, SubEvent>()
  for (const a of appearances ?? []) {
    const subMin = (a as unknown as { sub_minute?: number | null }).sub_minute
    if (!subMin) continue
    const p = playerMap.get(a.player_id)
    if (!p) continue
    const firstName = p.name.split(' ')[0]
    const ev = subMap.get(subMin) ?? { minute: subMin, out: null, in: null }
    if (a.starter) ev.out = firstName
    else ev.in = firstName
    subMap.set(subMin, ev)
  }
  const subEvents = [...subMap.values()].sort((a, b) => a.minute - b.minute)

  // Visualización táctica con formación
  const matchFormation = (match as unknown as { formation?: string | null }).formation ?? null
  const formationDef = matchFormation ? getFormation(matchFormation) : null
  type FormationLine = (StarterInfo | null)[]
  let formationLines: FormationLine[] | null = null
  if (formationDef && showLineup) {
    // Mapa: slotId → StarterInfo
    const pitchMap = new Map<string, StarterInfo>(
      (appearances ?? [])
        .map(a => {
          const slot = (a as unknown as { pitch_position?: string | null }).pitch_position
          if (!slot) return null
          const p = playerMap.get(a.player_id)
          if (!p) return null
          return [slot, {
            id: p.id, name: p.name, number: p.number, position: p.position,
            goals: a.goals ?? 0, yellow: a.yellow_cards ?? 0, red: a.red_cards ?? 0, isMvp: p.id === mvpId,
          } as StarterInfo] as [string, StarterInfo]
        })
        .filter((x): x is [string, StarterInfo] => x !== null)
    )
    // Construir líneas si al menos hay 1 posición asignada
    if (pitchMap.size > 0) {
      formationLines = formationDef.lines.map(line =>
        line.map(slot => pitchMap.get(slot.id) ?? null)
      )
    }
  }

  const dateStr = new Date(match.played_at + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const matchTimeStr = (match as { match_time?: string | null }).match_time?.slice(0, 5) ?? null

  return (
    <PageTransition>
      <main className="mx-auto max-w-5xl px-4 py-6 pb-32 md:pb-10">
        {sp.error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-start gap-3">
            <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={{ fontSize: 18, color: '#f87171' }}>error</span>
            <div>
              <p className="text-sm font-bold" style={{ color: '#f87171' }}>Error al guardar las estadísticas</p>
              <p className="text-xs mt-0.5" style={{ color: '#fca5a5' }}>{sp.error}</p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="mb-6 rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}>

          {/* Barra superior: breadcrumb + nav entre partidos */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--bdr-strong)', backgroundColor: 'var(--bg-card-2)' }}>
            <Link href={`/dashboard/season/${seasonId}`}
              className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
              style={{ color: 'var(--tx-3)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span>
              {season.name}
            </Link>
            <div className="flex items-center gap-1.5">
              <RivalLogoUpload
                matchId={matchId}
                seasonId={seasonId}
                currentUrl={(match as { rival_logo_url?: string | null }).rival_logo_url}
                opponentName={match.opponent}
              />
              {convocatoriaId && (
                <Link href={`/dashboard/season/${seasonId}/convocatorias/${convocatoriaId}`}
                  className="flex items-center justify-center w-8 h-8 rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-3)' }} title="Ver convocatoria">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>groups</span>
                </Link>
              )}
              <DeleteMatchButton matchId={matchId} seasonId={seasonId} />
              {allMatches && allMatches.length > 1 && (
                <div className="flex items-center gap-1 ml-1">
                  {prevMatch ? (
                    <Link href={`/dashboard/season/${seasonId}/match/${prevMatch.id}`}
                      className="flex items-center justify-center w-8 h-8 rounded-lg border transition-colors"
                      style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-3)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span>
                    </Link>
                  ) : (
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg border opacity-20"
                      style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span>
                    </span>
                  )}
                  <span className="text-[10px] tabular-nums px-1" style={{ color: 'var(--tx-3)' }}>{matchIndex + 1}/{allMatches.length}</span>
                  {nextMatch ? (
                    <Link href={`/dashboard/season/${seasonId}/match/${nextMatch.id}`}
                      className="flex items-center justify-center w-8 h-8 rounded-lg border transition-colors"
                      style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-3)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                    </Link>
                  ) : (
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg border opacity-20"
                      style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cuerpo: equipos + marcador */}
          <div className="flex items-center justify-between px-4 md:px-8 py-5 gap-4">

            {/* Equipo local */}
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <div className="w-14 h-14 rounded-xl border overflow-hidden flex items-center justify-center"
                style={{ backgroundColor: team.logo_url ? 'white' : 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)' }}>
                {team.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={team.logo_url} alt={team.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="text-[13px] font-black" style={{ color: 'var(--tx)' }}>
                    {team.name.trim().split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-[13px] font-bold text-center leading-tight truncate w-full text-center" style={{ color: 'var(--tx)' }}>{team.name}</p>
              <p className="text-[10px] font-semibold" style={{ color: 'var(--tx-3)' }}>{match.home ? 'Local' : 'Visitante'}</p>
            </div>

            {/* Marcador */}
            <div className="flex flex-col items-center flex-shrink-0 px-2">
              {isScheduled ? (
                <>
                  <span className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--tx-3)' }}>
                    {dateStr.split(',')[0]}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[28px] font-black" style={{ color: 'var(--tx-3)' }}>–</span>
                  </div>
                  {matchTimeStr && (
                    <span className="text-[12px] font-bold mt-1" style={{ color: 'var(--accent)' }}>{matchTimeStr}h</span>
                  )}
                </>
              ) : (
                <>
                  {(() => {
                    const gf = match.goals_for ?? 0
                    const ga = match.goals_against ?? 0
                    const res = gf > ga ? 'V' : gf < ga ? 'D' : 'E'
                    const resColor = res === 'V' ? 'var(--accent)' : res === 'D' ? '#ef4444' : '#f59e0b'
                    return (
                      <>
                        <div className="flex items-center gap-1 md:gap-2">
                          <span className="text-[44px] md:text-[56px] font-black tabular-nums leading-none"
                            style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>{gf}</span>
                          <span className="text-[20px] md:text-[24px] font-black" style={{ color: 'var(--bdr-strong)' }}>–</span>
                          <span className="text-[44px] md:text-[56px] font-black tabular-nums leading-none"
                            style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>{ga}</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider mt-0.5 px-2 py-0.5 rounded"
                          style={{ color: resColor, backgroundColor: `${resColor}14` }}>
                          {res === 'V' ? 'Victoria' : res === 'D' ? 'Derrota' : 'Empate'}
                        </span>
                      </>
                    )
                  })()}
                </>
              )}
              {match.competition && (
                <p className="text-[10px] mt-2 text-center" style={{ color: 'var(--tx-3)' }}>{match.competition}</p>
              )}
            </div>

            {/* Rival */}
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              {(match as { rival_logo_url?: string | null }).rival_logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={(match as { rival_logo_url: string }).rival_logo_url} alt={match.opponent}
                  className="w-14 h-14 rounded-xl border object-contain"
                  style={{ backgroundColor: 'white', borderColor: 'var(--bdr-strong)' }} />
              ) : (
                <div className="w-14 h-14 rounded-xl border flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)' }}>
                  <span className="text-[13px] font-black" style={{ color: 'var(--tx-3)' }}>
                    {match.opponent.trim().split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
                  </span>
                </div>
              )}
              <p className="text-[13px] font-bold text-center leading-tight truncate w-full text-center" style={{ color: 'var(--tx)' }}>{match.opponent}</p>
              <p className="text-[10px] font-semibold" style={{ color: 'var(--tx-3)' }}>{match.home ? 'Visitante' : 'Local'}</p>
            </div>
          </div>

          {/* Footer: fecha + compartir */}
          <div className="px-4 pb-4 flex items-center justify-between gap-3">
            <p className="text-[11px]" style={{ color: 'var(--tx-3)' }}>
              {dateStr}{matchTimeStr && !isScheduled ? ` · ${matchTimeStr}h` : ''}
            </p>
            {!isScheduled && (
              <ShareWhatsAppButton
                opponent={match.opponent}
                home={match.home}
                goalsFor={match.goals_for ?? 0}
                goalsAgainst={match.goals_against ?? 0}
                teamName={team.name}
                competition={match.competition}
                scorers={scorerApps.map(a => ({
                  name: playerMap.get(a.player_id)?.name ?? '',
                  goals: a.goals ?? 0,
                }))}
                mvpName={mvpPlayer?.name ?? null}
              />
            )}
          </div>
        </div>

        {/* Resumen del partido — solo si está finalizado */}
        {!isScheduled && hasSummary && (
          <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 rounded-xl border px-4 py-3"
            style={{ borderColor: 'var(--bdr-strong)', backgroundColor: 'var(--bg-card)' }}>
            {scorerApps.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 15, color: 'var(--accent)' }}>sports_soccer</span>
                <span style={{ color: 'var(--tx)' }}>
                  {scorerApps.map(a => {
                    const first = playerMap.get(a.player_id)?.name?.split(' ')[0] ?? '?'
                    return (a.goals ?? 0) > 1 ? `${first} ×${a.goals}` : first
                  }).join(' · ')}
                </span>
              </div>
            )}
            {yellowApps.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="w-3 h-4 rounded-[2px] flex-shrink-0" style={{ backgroundColor: '#facc15' }} />
                <span style={{ color: 'var(--tx)' }}>
                  {yellowApps.map(a => {
                    const first = playerMap.get(a.player_id)?.name?.split(' ')[0] ?? '?'
                    return (a.yellow_cards ?? 0) > 1 ? `${first} ×${a.yellow_cards}` : first
                  }).join(' · ')}
                </span>
              </div>
            )}
            {redApps.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="w-3 h-4 rounded-[2px] flex-shrink-0" style={{ backgroundColor: '#f87171' }} />
                <span style={{ color: 'var(--tx)' }}>
                  {redApps.map(a => playerMap.get(a.player_id)?.name?.split(' ')[0] ?? '?').join(' · ')}
                </span>
              </div>
            )}
            {mvpPlayer && (
              <div className="flex items-center gap-1.5 text-sm">
                <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 15, color: '#fbbf24', fontVariationSettings: "'FILL' 1" }}>star</span>
                <span style={{ color: '#fbbf24' }}>{mvpPlayer.name.split(' ')[0]}</span>
              </div>
            )}
          </div>
        )}

        {/* Notas del partido */}
        {!isScheduled && matchNotes && (
          <div className="mb-6 rounded-xl border px-4 py-3 text-sm leading-relaxed"
            style={{ borderColor: 'var(--bdr-strong)', backgroundColor: 'var(--bg-card)', color: 'var(--tx-2)', whiteSpace: 'pre-line' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--tx-3)' }}>
              Análisis post-partido
            </p>
            {matchNotes}
          </div>
        )}

        {/* Picker de disponibilidad — solo en partidos programados */}
        {isScheduled && players && players.length > 0 && (
          <div className="mb-6">
            <AvailabilityPicker
              matchId={matchId}
              seasonId={seasonId}
              players={sortedPlayers}
              initialAvailability={initialAvailability}
            />
          </div>
        )}

        {/* Hoja imprimible — siempre visible */}
        <div className="mb-6 rounded-2xl border p-4" style={{ borderColor: 'var(--bdr-strong)', backgroundColor: 'var(--bg-card)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--tx-3)' }}>
            Hoja del partido
          </p>
          <MatchPrintSheet
            teamName={team.name}
            teamLogo={team.logo_url}
            opponent={match.opponent}
            rivalLogo={(match as { rival_logo_url?: string | null }).rival_logo_url}
            dateStr={dateStr}
            playedAt={match.played_at}
            matchTime={matchTimeStr}
            venue={(match as { venue?: string | null }).venue}
            matchIndex={matchIndex}
            seasonName={season.name}
            formation={matchFormation}
            pitchPositions={Object.fromEntries(
              (appearances ?? []).flatMap(a => {
                const slot = (a as unknown as { pitch_position?: string | null }).pitch_position
                return slot ? [[a.player_id, slot]] : []
              })
            )}
            players={(sortedPlayers ?? []).map(p => {
              if (isScheduled) {
                // Usar datos de disponibilidad: unavailable = excluida, el resto = en lista
                const avail = initialAvailability[p.id]
                return {
                  id: p.id, name: p.name, number: p.number, position: p.position,
                  status: avail === 'unavailable' ? 'no_convocada' as const : 'convocada' as const,
                }
              }
              // Partido finalizado: convocatoria si existe, si no, appearances
              const convStatus = convocatoriaStatuses[p.id] ?? null
              if (!convStatus) {
                const app = appearances?.find(a => a.player_id === p.id)
                if (app && (app.minutes ?? 0) > 0) {
                  return { id: p.id, name: p.name, number: p.number, position: p.position, status: (app.starter ? 'titular' : 'convocada') as 'titular' | 'convocada' }
                }
              }
              return { id: p.id, name: p.name, number: p.number, position: p.position, status: convStatus }
            })}
          />
        </div>

        {/* Respuestas del enlace público — solo si la feature está activa y hay datos */}
        {!isScheduled && team.availability_enabled && !!((availRows as { player_id: string; status: string }[] | null)?.length) && players && players.length > 0 && (
          <div className="mb-6">
            <AvailabilityCoachCard
              players={sortedPlayers}
              responses={(availRows as { player_id: string; status: string }[]).map(r => ({
                player_id: r.player_id,
                status: r.status as 'available' | 'unavailable' | 'doubt',
              }))}
            />
          </div>
        )}

        {/* ── Once inicial visual ────────────────────────────────── */}
        {showLineup && (
          <div className="mb-6 overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--bdr-strong)' }}>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: 'var(--bdr-strong)', backgroundColor: 'var(--bg-card)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--accent)' }}>sports_soccer</span>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--tx-2)' }}>
                {matchFormation ? `${matchFormation} · ` : ''}Once inicial · {starterList.length} titulares{subList.length > 0 ? ` · ${subList.length} suplentes` : ''}
              </p>
            </div>
            {/* Campo de fútbol */}
            <div className="relative select-none" style={{ backgroundColor: '#1a5232', minHeight: 260 }}>
              {/* Marcas del campo */}
              <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.15 }}>
                <div className="absolute left-0 right-0" style={{ top: '50%', height: 1, backgroundColor: 'white' }} />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" style={{ width: 70, height: 70 }} />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 border-t border-l border-r border-white" style={{ width: '55%', height: '20%' }} />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 border-b border-l border-r border-white" style={{ width: '55%', height: '20%' }} />
              </div>
              {/* Líneas del campo */}
              <div className="absolute inset-0 flex flex-col justify-between py-4 px-2">
                {formationLines ? (
                  // Vista táctica con formación asignada
                  formationLines.map((line, i) => (
                    <div key={i} className="flex justify-evenly">
                      {line.map((p, j) =>
                        p ? (
                          <PitchPlayer key={p.id} p={p} />
                        ) : (
                          <PitchPlayerEmpty key={`empty-${i}-${j}`} label={formationDef!.lines[i][j].label} />
                        )
                      )}
                    </div>
                  ))
                ) : (
                  // Vista por posición (sin formación asignada)
                  <>
                    {fwdLine.length > 0 && (
                      <div className="flex justify-evenly">
                        {fwdLine.map(p => <PitchPlayer key={p.id} p={p} />)}
                      </div>
                    )}
                    {midLine.length > 0 && (
                      <div className="flex justify-evenly">
                        {midLine.map(p => <PitchPlayer key={p.id} p={p} />)}
                      </div>
                    )}
                    {defLine.length > 0 && (
                      <div className="flex justify-evenly">
                        {defLine.map(p => <PitchPlayer key={p.id} p={p} />)}
                      </div>
                    )}
                    {gkLine.length > 0 && (
                      <div className="flex justify-center">
                        {gkLine.map(p => <PitchPlayer key={p.id} p={p} />)}
                      </div>
                    )}
                    {fwdLine.length === 0 && midLine.length === 0 && defLine.length === 0 && gkLine.length === 0 && (
                      <div className="flex flex-wrap justify-center gap-2 my-auto">
                        {starterList.map(p => <PitchPlayer key={p.id} p={p} />)}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            {/* Suplentes */}
            {subList.length > 0 && (
              <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--bdr-strong)', backgroundColor: 'var(--bg-card-2)' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--tx-3)' }}>Suplentes</p>
                <div className="flex flex-wrap gap-2">
                  {subList.map(p => (
                    <span key={p.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border font-medium" style={{ color: 'var(--tx-2)', backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)' }}>
                      {p.number != null && <span className="text-[9px]" style={{ color: 'var(--tx-3)' }}>#{p.number}</span>}
                      {p.name.split(' ')[0]}
                      {p.goals > 0 && <span className="text-[10px]" style={{ color: 'var(--accent)' }}>⚽{p.goals > 1 ? `×${p.goals}` : ''}</span>}
                      {p.yellow > 0 && <span className="inline-block w-2 h-2.5 rounded-[2px]" style={{ backgroundColor: '#facc15' }} />}
                      {p.red > 0 && <span className="inline-block w-2 h-2.5 rounded-[2px]" style={{ backgroundColor: '#f87171' }} />}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* Sustituciones */}
            {subEvents.length > 0 && (
              <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--bdr-strong)', backgroundColor: 'var(--bg-card-2)' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--tx-3)' }}>Sustituciones</p>
                <div className="flex flex-col gap-1.5">
                  {subEvents.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <span className="tabular-nums font-bold w-7 text-right flex-shrink-0" style={{ color: 'var(--tx-3)' }}>{e.minute}&apos;</span>
                      {e.out && <span style={{ color: '#f87171' }}>↓ {e.out}</span>}
                      {e.out && e.in && <span style={{ color: 'var(--tx-3)' }}>·</span>}
                      {e.in && <span style={{ color: 'var(--accent)' }}>↑ {e.in}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <MatchForm
          match={{
            ...match,
            competition_type: (match as { competition_type?: string | null }).competition_type ?? null,
            formation: matchFormation,
          }}
          players={sortedPlayers}
          appearances={appearances ?? []}
          seasonId={seasonId}
          teamName={team.name}
          teamGender={team.gender}
          saved={!!sp.saved}
          convocatoriaStatuses={Object.keys(convocatoriaStatuses).length > 0 ? convocatoriaStatuses : undefined}
          isScheduled={isScheduled}
        />

        {/* Tarjeta compartible — solo si está finalizado */}
        {!isScheduled && <section className="mt-8 rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}>
            <h3 className="text-[16px] font-semibold mb-4" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--tx)' }}>
              Compartir resultado
            </h3>
            <MatchShareCard
              teamName={team.name}
              logoUrl={team.logo_url}
              opponent={match.opponent}
              goalsFor={match.goals_for}
              goalsAgainst={match.goals_against}
              playedAt={match.played_at}
              home={match.home}
              competition={(match as { competition?: string | null }).competition}
              scorers={scorerApps.map(a => ({
                name: playerMap.get(a.player_id)?.name ?? '?',
                goals: a.goals ?? 0,
              }))}
              mvpName={mvpPlayer?.name ?? null}
              lineupData={formationLines && formationDef ? {
                formation: matchFormation!,
                lines: formationLines.map((line, i) =>
                  line.map((p, j) => ({
                    label: formationDef!.lines[i][j].label,
                    player: p ? { name: p.name, number: p.number } : null,
                  }))
                ),
              } : null}
            />
          </section>}
      </main>
    </PageTransition>
  )
}

function PitchPlayer({ p }: { p: { name: string; number: number | null; goals: number; yellow: number; red: number; isMvp: boolean } }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[44px]">
      <div className="relative w-9 h-9 rounded-full border-2 flex items-center justify-center text-[11px] font-black"
        style={{ borderColor: p.isMvp ? '#fbbf24' : 'var(--accent)', backgroundColor: p.isMvp ? 'rgba(251,191,36,0.2)' : 'rgba(75,226,119,0.15)', color: 'white' }}>
        {p.number ?? '?'}
        {p.isMvp && (
          <span className="absolute -top-1.5 -right-1.5 text-[10px]">★</span>
        )}
      </div>
      <p className="text-[9px] font-semibold text-white text-center leading-tight max-w-[50px] truncate">{p.name.split(' ')[0]}</p>
      <div className="flex items-center gap-0.5">
        {p.goals > 0 && <span className="text-[9px]" style={{ color: 'var(--accent)' }}>⚽{p.goals > 1 ? `×${p.goals}` : ''}</span>}
        {p.yellow > 0 && <span className="inline-block w-1.5 h-2 rounded-[1px]" style={{ backgroundColor: '#facc15' }} />}
        {p.red > 0 && <span className="inline-block w-1.5 h-2 rounded-[1px]" style={{ backgroundColor: '#f87171' }} />}
      </div>
    </div>
  )
}

function PitchPlayerEmpty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[44px]">
      <div className="w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center text-[8px] font-bold"
        style={{ borderColor: 'rgba(75,226,119,0.2)', backgroundColor: 'rgba(75,226,119,0.04)', color: 'rgba(75,226,119,0.35)' }}>
        {label}
      </div>
      <p className="text-[9px] text-center leading-tight" style={{ color: 'rgba(255,255,255,0.15)' }}>—</p>
    </div>
  )
}
