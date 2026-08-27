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
import Link from 'next/link'

export default async function MatchPage({
  params, searchParams,
}: {
  params: Promise<{ id: string; matchId: string }>
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const { id: seasonId, matchId } = await params
  const supabase = await createClient()

  const { data: match } = await supabase
    .from('matches').select('*, seasons(*, teams(*))').eq('id', matchId).single()
  if (!match) notFound()

  const season = match.seasons as { id: string; name: string; teams: { id: string; name: string; gender?: string | null; availability_enabled?: boolean } }
  const team = season.teams

  const isScheduledEarly = (match as { status?: string }).status === 'scheduled'

  const [{ data: players }, { data: appearances }, { data: convocatoria }, { data: allMatches }, { data: availRows }] = await Promise.all([
    supabase.from('players').select('*').eq('team_id', team.id).eq('active', true)
      .order('number', { ascending: true, nullsFirst: false }),
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

  return (
    <PageTransition>
      <main className="mx-auto max-w-5xl px-4 py-6">
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
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <Link
              href={`/dashboard/season/${seasonId}`}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span> {season.name}
            </Link>
            {allMatches && allMatches.length > 1 && (
              <div className="flex items-center gap-1">
                {prevMatch ? (
                  <Link href={`/dashboard/season/${seasonId}/match/${prevMatch.id}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors hover:bg-slate-800"
                    style={{ borderColor: '#2e3447', color: '#adb4ce' }}
                    title={`Anterior: ${prevMatch.opponent}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span>
                    <span className="hidden sm:inline max-w-[80px] truncate">{prevMatch.opponent}</span>
                  </Link>
                ) : (
                  <span className="flex items-center px-2.5 py-1 rounded-lg border opacity-25 text-[11px]"
                    style={{ borderColor: '#2e3447', color: '#adb4ce' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span>
                  </span>
                )}
                <span className="text-[10px] px-1.5 tabular-nums" style={{ color: '#475569' }}>
                  {matchIndex + 1}/{allMatches.length}
                </span>
                {nextMatch ? (
                  <Link href={`/dashboard/season/${seasonId}/match/${nextMatch.id}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors hover:bg-slate-800"
                    style={{ borderColor: '#2e3447', color: '#adb4ce' }}
                    title={`Siguiente: ${nextMatch.opponent}`}>
                    <span className="hidden sm:inline max-w-[80px] truncate">{nextMatch.opponent}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                  </Link>
                ) : (
                  <span className="flex items-center px-2.5 py-1 rounded-lg border opacity-25 text-[11px]"
                    style={{ borderColor: '#2e3447', color: '#adb4ce' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-white truncate">
                {match.home ? 'vs' : '@'} {match.opponent}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {dateStr}{match.competition ? ` · ${match.competition}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <RivalLogoUpload
                matchId={matchId}
                currentUrl={(match as { rival_logo_url?: string | null }).rival_logo_url}
                opponentName={match.opponent}
              />
              <DeleteMatchButton matchId={matchId} seasonId={seasonId} />
              {convocatoriaId && (
                <Link
                  href={`/dashboard/season/${seasonId}/convocatorias/${convocatoriaId}`}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
                  title="Ver convocatoria"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>groups</span>
                </Link>
              )}
              {isScheduled ? (
                <div className="flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3"
                  style={{ borderColor: 'rgba(251,191,36,0.3)', backgroundColor: 'rgba(251,191,36,0.08)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#fbbf24' }}>schedule</span>
                  <span className="text-xs font-bold" style={{ color: '#fbbf24' }}>Programado</span>
                </div>
              ) : (
                <div className="flex h-10 items-center justify-center rounded-xl border border-slate-700 px-3 font-[family-name:var(--font-heading)] text-lg font-bold text-white">
                  {match.goals_for}–{match.goals_against}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resumen del partido — solo si está finalizado */}
        {!isScheduled && hasSummary && (
          <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 rounded-xl border px-4 py-3"
            style={{ borderColor: '#2e3447', backgroundColor: '#151b2d' }}>
            {scorerApps.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 15, color: '#4be277' }}>sports_soccer</span>
                <span style={{ color: '#dce1fb' }}>
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
                <span style={{ color: '#dce1fb' }}>
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
                <span style={{ color: '#dce1fb' }}>
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
            style={{ borderColor: '#2e3447', backgroundColor: '#151b2d', color: '#adb4ce', whiteSpace: 'pre-line' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#475569' }}>
              Análisis post-partido
            </p>
            {matchNotes}
          </div>
        )}

        {/* Picker siempre visible en partidos programados — el entrenador lo rellena él mismo */}
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
          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800" style={{ backgroundColor: '#151b2d' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#4be277' }}>sports_soccer</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
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
              <div className="px-4 py-3 border-t border-slate-800" style={{ backgroundColor: '#0f1629' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-2">Suplentes</p>
                <div className="flex flex-wrap gap-2">
                  {subList.map(p => (
                    <span key={p.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border border-slate-700 font-medium" style={{ color: '#adb4ce', backgroundColor: '#191f31' }}>
                      {p.number != null && <span className="text-[9px] text-slate-600">#{p.number}</span>}
                      {p.name.split(' ')[0]}
                      {p.goals > 0 && <span className="text-[10px]" style={{ color: '#4be277' }}>⚽{p.goals > 1 ? `×${p.goals}` : ''}</span>}
                      {p.yellow > 0 && <span className="inline-block w-2 h-2.5 rounded-[2px]" style={{ backgroundColor: '#facc15' }} />}
                      {p.red > 0 && <span className="inline-block w-2 h-2.5 rounded-[2px]" style={{ backgroundColor: '#f87171' }} />}
                    </span>
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
        {!isScheduled && <section className="mt-8 rounded-[24px] border p-6" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
            <h3 className="text-[16px] font-semibold text-white mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
              Compartir resultado
            </h3>
            <MatchShareCard
              teamName={team.name}
              logoUrl={(season as unknown as { teams: { logo_url?: string | null } }).teams.logo_url}
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
        style={{ borderColor: p.isMvp ? '#fbbf24' : '#4be277', backgroundColor: p.isMvp ? 'rgba(251,191,36,0.2)' : 'rgba(75,226,119,0.15)', color: 'white' }}>
        {p.number ?? '?'}
        {p.isMvp && (
          <span className="absolute -top-1.5 -right-1.5 text-[10px]">★</span>
        )}
      </div>
      <p className="text-[9px] font-semibold text-white text-center leading-tight max-w-[50px] truncate">{p.name.split(' ')[0]}</p>
      <div className="flex items-center gap-0.5">
        {p.goals > 0 && <span className="text-[9px]" style={{ color: '#4be277' }}>⚽{p.goals > 1 ? `×${p.goals}` : ''}</span>}
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
