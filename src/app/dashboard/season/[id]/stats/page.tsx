import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { PageTransition } from '@/components/ui/page-transition'
import { TeamLogo } from '@/components/team/team-logo'
import { PlayerAvatar } from '@/components/team/player-avatar'
import { getTeamTerms } from '@/lib/team-terms'
import type { Metadata } from 'next'
import { ShareButton } from '@/components/season/share-button'
import { DownloadStatsCsv } from '@/components/season/download-stats-csv'
import { EvolutionChart } from '@/components/season/evolution-chart'
import { GoalRaceChart } from '@/components/season/goal-race-chart'
import type { GoalRaceLine } from '@/components/season/goal-race-chart'
import type { ChartMatch } from '@/components/season/evolution-chart'
import { PlayerCompare } from '@/components/season/player-compare'
import type { CompareStat } from '@/components/season/player-compare'
import { SortableStatsTable } from '@/components/season/sortable-stats-table'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('seasons').select('name, teams(name)').eq('id', id).single()
  if (!data) return { title: 'Estadísticas' }
  const team = Array.isArray(data.teams) ? data.teams[0] : data.teams as { name: string } | null
  return { title: `Estadísticas ${data.name}${team ? ` · ${team.name}` : ''}` }
}

const YELLOW_WARNING = 4
const CIRCUM = 2 * Math.PI * 80 // 502.65

function shortName(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length <= 1) return name
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`
}

export default async function StatsPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ct?: string }>
}) {
  const { id: seasonId } = await params
  const { ct: ctParam = 'all' } = await searchParams
  const supabase = await createClient()

  const [{ data: season }, { data: allMatchesRaw }, { data: trainingSessions }] = await Promise.all([
    supabase.from('seasons').select('*, teams(*)').eq('id', seasonId).single(),
    supabase.from('matches').select('*').eq('season_id', seasonId).order('played_at'),
    supabase.from('training_sessions').select('id').eq('season_id', seasonId),
  ])
  if (!season) notFound()

  const team = season.teams as { id: string; name: string; logo_url?: string | null; gender?: string | null }
  const shareToken = (season as { share_token?: string | null }).share_token ?? null
  const terms = getTeamTerms(team.gender)

  // Solo partidos finalizados (excluir programados)
  type MatchRaw = NonNullable<typeof allMatchesRaw>[0]
  const finishedMatches = (allMatchesRaw ?? []).filter(m => (m as MatchRaw & { status?: string }).status !== 'scheduled')

  const ligaFinished  = finishedMatches.filter(m => ((m as MatchRaw & { competition_type?: string }).competition_type ?? 'liga') === 'liga')
  const copaFinished  = finishedMatches.filter(m => ((m as MatchRaw & { competition_type?: string }).competition_type ?? 'liga') === 'copa')
  const hasCopaInStats = copaFinished.length > 0
  const ligaPts = ligaFinished.reduce((s, m) => s + (m.goals_for > m.goals_against ? 3 : m.goals_for === m.goals_against ? 1 : 0), 0)

  const amistososFinished = finishedMatches.filter(m => ((m as MatchRaw & { competition_type?: string }).competition_type ?? 'liga') === 'amistoso')
  const hasAmistosos = amistososFinished.length > 0
  const competitiveFinished = finishedMatches.filter(m => ((m as MatchRaw & { competition_type?: string }).competition_type ?? 'liga') !== 'amistoso')

  const filteredForStats: MatchRaw[] =
    ctParam === 'liga'        ? ligaFinished :
    ctParam === 'copa'        ? copaFinished :
    ctParam === 'competitive' ? competitiveFinished :
    finishedMatches  // default 'todos': todos los partidos finalizados

  // Alias para mantener compatibilidad con el resto del código
  const matches = filteredForStats

  // Appearances: fetch from ALL finished matches so charts always have full data
  const allFinishedIds = finishedMatches.map(m => m.id)
  const { data: allAppearances } = allFinishedIds.length
    ? await supabase.from('appearances').select('*, players(name, number, position, photo_url)').in('match_id', allFinishedIds)
    : { data: [] }
  // For rankings: filter to CT-filtered matches only
  const filteredMatchIdSet = new Set(filteredForStats.map(m => m.id))
  const appearances = (allAppearances ?? []).filter(a => filteredMatchIdSet.has((a as { match_id: string }).match_id))

  const matchIdsList = filteredForStats.map(m => m.id)
  const sessionIds   = trainingSessions?.map(s => s.id) ?? []

  type AttRow = { session_id: string; player_id: string; attended: boolean }
  type AttPlayer = { id: string; name: string; number: number | null; position: string | null; photo_url: string | null }
  let attendanceRecords: AttRow[]    = []
  let teamPlayersForAtt: AttPlayer[] = []

  if (sessionIds.length > 0) {
    const [{ data: att }, { data: tPlayers }] = await Promise.all([
      supabase.from('training_attendance').select('session_id, player_id, attended').in('session_id', sessionIds),
      supabase.from('players').select('id, name, number, position, photo_url').eq('team_id', team.id).order('name'),
    ])
    attendanceRecords  = (att ?? []) as AttRow[]
    teamPlayersForAtt  = (tPlayers ?? []) as AttPlayer[]
  }

  type AttStat = { playerId: string; name: string; number: number | null; position: string | null; photoUrl: string | null; attended: number; total: number }
  const attMap = new Map<string, AttStat>()
  const recordedPlayers = new Set(attendanceRecords.map(r => r.player_id))
  for (const p of teamPlayersForAtt) {
    if (!recordedPlayers.has(p.id)) continue
    attMap.set(p.id, { playerId: p.id, name: p.name, number: p.number, position: p.position, photoUrl: p.photo_url, attended: 0, total: 0 })
  }
  for (const r of attendanceRecords) {
    const s = attMap.get(r.player_id)
    if (!s) continue
    s.total++
    if (r.attended) s.attended++
  }
  const attStats = Array.from(attMap.values()).filter(s => s.total > 0).sort((a, b) => (b.attended / b.total) - (a.attended / a.total))
  const totalAttended = attStats.reduce((s, a) => s + a.attended, 0)
  const totalRecorded = attStats.reduce((s, a) => s + a.total, 0)
  const avgAttPct     = totalRecorded > 0 ? Math.round((totalAttended / totalRecorded) * 100) : 0

  const wins         = matches?.filter(m => m.goals_for > m.goals_against).length ?? 0
  const draws        = matches?.filter(m => m.goals_for === m.goals_against).length ?? 0
  const losses       = matches?.filter(m => m.goals_for < m.goals_against).length ?? 0
  const goalsFor     = matches?.reduce((s, m) => s + m.goals_for, 0) ?? 0
  const goalsAgainst = matches?.reduce((s, m) => s + m.goals_against, 0) ?? 0
  const cleanSheets  = matches?.filter(m => m.goals_against === 0).length ?? 0
  const total        = matches?.length ?? 0
  const winRate      = total > 0 ? Math.round((wins / total) * 100) : 0
  const cleanRate    = total > 0 ? Math.round((cleanSheets / total) * 100) : 0

  // Donut SVG
  const winPct       = total > 0 ? wins / total : 0
  const drawPct      = total > 0 ? draws / total : 0
  const lossPct      = total > 0 ? losses / total : 0
  const winOffset    = CIRCUM * (1 - winPct)
  const drawOffset   = CIRCUM * (1 - drawPct)
  const lossOffset   = CIRCUM * (1 - lossPct)
  const drawRotation = winPct * 360
  const lossRotation = (winPct + drawPct) * 360

  const goalDiff = goalsFor - goalsAgainst
  const avgFor   = total > 0 ? (goalsFor / total).toFixed(1) : '0.0'
  const avgAgainst = total > 0 ? (goalsAgainst / total).toFixed(1) : '0.0'

  // Casa vs fuera
  const homeM  = matches?.filter(m =>  m.home) ?? []
  const awayM  = matches?.filter(m => !m.home) ?? []
  const homeW  = homeM.filter(m => m.goals_for > m.goals_against).length
  const homeD  = homeM.filter(m => m.goals_for === m.goals_against).length
  const homeL  = homeM.filter(m => m.goals_for < m.goals_against).length
  const awayW  = awayM.filter(m => m.goals_for > m.goals_against).length
  const awayD  = awayM.filter(m => m.goals_for === m.goals_against).length
  const awayL  = awayM.filter(m => m.goals_for < m.goals_against).length

  // Racha (newest first)
  const matchesChron = [...(matches ?? [])].reverse()
  const streak = matchesChron.map(m => {
    if (m.goals_for > m.goals_against) return { r: 'V', win: true, draw: false }
    if (m.goals_for < m.goals_against) return { r: 'D', win: false, draw: false }
    return { r: 'E', win: false, draw: true }
  })

  // Racha actual en texto
  type StreakType = 'win' | 'draw' | 'loss'
  let currentStreakType: StreakType | null = null
  let currentStreakCount = 0
  for (const m of matchesChron) {
    const t: StreakType = m.goals_for > m.goals_against ? 'win' : m.goals_for < m.goals_against ? 'loss' : 'draw'
    if (currentStreakType === null) { currentStreakType = t; currentStreakCount = 1 }
    else if (currentStreakType === t) currentStreakCount++
    else break
  }
  const streakLabel = currentStreakType === 'win'  ? `${currentStreakCount} victorias seguidas`
                    : currentStreakType === 'loss' ? `${currentStreakCount} derrotas seguidas`
                    : currentStreakCount > 1       ? `${currentStreakCount} empates seguidos`
                    : null
  const streakColor = currentStreakType === 'win' ? '#4be277' : currentStreakType === 'loss' ? '#f87171' : '#fbbf24'

  // Racha invicta (sin perder consecutivos, puede mezclar V y E)
  let unbeatenRun = 0
  for (const m of matchesChron) {
    if (m.goals_for >= m.goals_against) unbeatenRun++
    else break
  }
  // Solo mostrar "sin perder en X" si hay más partidos que la racha de victorias
  const showUnbeaten = unbeatenRun >= 3 && !(currentStreakType === 'win' && currentStreakCount === unbeatenRun)

  // Player stats
  type PS = {
    playerId: string; name: string; number: number | null; position: string | null; photoUrl: string | null
    goals: number; assists: number; minutes: number; yellowCards: number; redCards: number; gamesPlayed: number
  }
  const statsMap = new Map<string, PS>()
  for (const app of appearances ?? []) {
    const p = app.players as { name: string; number: number | null; position: string | null; photo_url: string | null }
    if (!statsMap.has(app.player_id)) {
      statsMap.set(app.player_id, { playerId: app.player_id, name: p.name, number: p.number, position: p.position, photoUrl: p.photo_url, goals: 0, assists: 0, minutes: 0, yellowCards: 0, redCards: 0, gamesPlayed: 0 })
    }
    const s = statsMap.get(app.player_id)!
    s.goals += app.goals ?? 0; s.assists += app.assists ?? 0; s.minutes += app.minutes ?? 0
    s.yellowCards += app.yellow_cards ?? 0; s.redCards += app.red_cards ?? 0
    if ((app.minutes ?? 0) > 0) s.gamesPlayed++
  }
  const stats     = Array.from(statsMap.values())
  const byGoals        = [...stats].sort((a, b) => b.goals - a.goals).filter(s => s.goals > 0)
  const byAssists      = [...stats].sort((a, b) => b.assists - a.assists).filter(s => s.assists > 0)
  const byMinutes      = [...stats].sort((a, b) => b.minutes - a.minutes).filter(s => s.minutes > 0)
  const byCards        = [...stats].filter(s => s.yellowCards > 0 || s.redCards > 0).sort((a, b) => (b.yellowCards + b.redCards * 2) - (a.yellowCards + a.redCards * 2))
  const byGames        = [...stats].sort((a, b) => b.gamesPlayed - a.gamesPlayed).filter(s => s.gamesPlayed > 0)
  const byContribs     = [...stats].filter(s => s.goals + s.assists > 0).sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))

  // Valoraciones del entrenador por jugadora
  const ratingAccum = new Map<string, { sum: number; count: number }>()
  for (const app of appearances ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = (app as any).rating as number | null
    if (r && r > 0) {
      const prev = ratingAccum.get(app.player_id) ?? { sum: 0, count: 0 }
      ratingAccum.set(app.player_id, { sum: prev.sum + r, count: prev.count + 1 })
    }
  }
  const byRating = [...stats]
    .filter(s => ratingAccum.has(s.playerId))
    .map(s => ({
      ...s,
      avgRating: ratingAccum.get(s.playerId)!.sum / ratingAccum.get(s.playerId)!.count,
      ratingCount: ratingAccum.get(s.playerId)!.count,
    }))
    .sort((a, b) => b.avgRating - a.avgRating)

  // MVP por partido (usa mvp_player_id de matches, disponible tras migración 007)
  const mvpCounts = new Map<string, number>()
  for (const m of matches ?? []) {
    const mvpId = (m as unknown as { mvp_player_id?: string | null }).mvp_player_id
    if (mvpId) mvpCounts.set(mvpId, (mvpCounts.get(mvpId) ?? 0) + 1)
  }
  const byMvp = [...stats]
    .filter(s => (mvpCounts.get(s.playerId) ?? 0) > 0)
    .sort((a, b) => (mvpCounts.get(b.playerId) ?? 0) - (mvpCounts.get(a.playerId) ?? 0))

  // Desglose por posición
  type PosStat = { position: string; goals: number; assists: number; minutes: number; players: Set<string> }
  const posMap = new Map<string, PosStat>()
  for (const s of stats) {
    const pos = s.position ?? 'Sin posición'
    if (!posMap.has(pos)) posMap.set(pos, { position: pos, goals: 0, assists: 0, minutes: 0, players: new Set() })
    const p = posMap.get(pos)!
    p.goals   += s.goals
    p.assists += s.assists
    p.minutes += s.minutes
    p.players.add(s.playerId)
  }
  const byPosition = Array.from(posMap.values())
    .filter(p => p.players.size > 0)
    .sort((a, b) => b.goals - a.goals)
  const maxPosGoals = Math.max(...byPosition.map(p => p.goals), 1)

  // Desglose por competición
  type CompStat = { name: string; played: number; W: number; E: number; D: number; gf: number; ga: number }
  const compMap = new Map<string, CompStat>()
  for (const m of matches ?? []) {
    const key = m.competition?.trim() || 'Sin competición'
    if (!compMap.has(key)) compMap.set(key, { name: key, played: 0, W: 0, E: 0, D: 0, gf: 0, ga: 0 })
    const s = compMap.get(key)!
    s.played++; s.gf += m.goals_for; s.ga += m.goals_against
    if (m.goals_for > m.goals_against) s.W++
    else if (m.goals_for === m.goals_against) s.E++
    else s.D++
  }
  const competitions = Array.from(compMap.values()).sort((a, b) => b.played - a.played)

  // Gráfico de evolución de puntos — siempre usa solo Liga (los amistosos y copa no dan puntos)
  const ligaMatchesChrono = [...ligaFinished].sort((a, b) => a.played_at.localeCompare(b.played_at))
  let cumPts = 0
  const chartPoints: ChartMatch[] = ligaMatchesChrono.map(m => {
    const res: 'V' | 'E' | 'D' = m.goals_for > m.goals_against ? 'V' : m.goals_for < m.goals_against ? 'D' : 'E'
    cumPts += res === 'V' ? 3 : res === 'E' ? 1 : 0
    return { opponent: m.opponent, result: res, gf: m.goals_for, ga: m.goals_against, cumPoints: cumPts, date: m.played_at }
  })

  // Carrera goleadora — siempre usa Liga + Copa (no amistosos); top 5 goles acumulados partido a partido
  const competitiveMatchesChrono = [...competitiveFinished].sort((a, b) => a.played_at.localeCompare(b.played_at))
  const RACE_COLORS = ['#4be277', '#60a5fa', '#facc15', '#f472b6', '#a78bfa']
  const top5Scorers = byGoals.slice(0, 5)
  const goalRacePlayers: GoalRaceLine[] = top5Scorers.map((scorer, i) => {
    let cum = 0
    const cumGoals = competitiveMatchesChrono.map(m => {
      const app = (allAppearances ?? []).find(
        a => a.player_id === scorer.playerId && (a as { match_id: string }).match_id === m.id
      )
      cum += app?.goals ?? 0
      return cum
    })
    return { name: scorer.name, color: RACE_COLORS[i], cumGoals }
  })
  const raceMatchLabels = competitiveMatchesChrono.map(m => m.opponent)

  // Datos para comparar jugadoras
  const compareStats: CompareStat[] = stats.map(s => ({
    playerId: s.playerId, name: s.name, photoUrl: s.photoUrl, position: s.position,
    goals: s.goals, assists: s.assists, minutes: s.minutes,
    yellowCards: s.yellowCards, redCards: s.redCards, gamesPlayed: s.gamesPlayed,
  }))

  // Bar chart: last 10 matches, newest first
  const last10       = matchesChron.slice(0, 10)
  const maxGoalsBar  = Math.max(...last10.map(m => Math.max(m.goals_for, m.goals_against)), 1)

  // H2H por rival
  type H2H = { opponent: string; played: number; W: number; E: number; D: number; gf: number; ga: number; lastResult: 'V' | 'E' | 'D' }
  const h2hMap = new Map<string, H2H>()
  for (const m of [...(matches ?? [])].sort((a, b) => a.played_at.localeCompare(b.played_at))) {
    const key = m.opponent.trim()
    if (!h2hMap.has(key)) h2hMap.set(key, { opponent: key, played: 0, W: 0, E: 0, D: 0, gf: 0, ga: 0, lastResult: 'E' })
    const s = h2hMap.get(key)!
    s.played++; s.gf += m.goals_for; s.ga += m.goals_against
    const r: 'V' | 'E' | 'D' = m.goals_for > m.goals_against ? 'V' : m.goals_for < m.goals_against ? 'D' : 'E'
    if (r === 'V') s.W++; else if (r === 'E') s.E++; else s.D++
    s.lastResult = r
  }
  const h2h = Array.from(h2hMap.values()).sort((a, b) => b.played - a.played || a.opponent.localeCompare(b.opponent))

  return (
    <PageTransition>
      <main className="max-w-7xl mx-auto px-4 md:px-10 py-8 pb-32 md:pb-10">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center border border-[#2e3447] overflow-hidden" style={{ backgroundColor: '#191f31' }}>
              <TeamLogo name={team.name} logoUrl={team.logo_url} size="lg" className="h-12 w-12" />
            </div>
            <div>
              <h2 className="text-[32px] font-extrabold leading-10 tracking-tight text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                Estadísticas de Temporada
              </h2>
              <p className="text-sm mt-0.5" style={{ color: '#adb4ce' }}>
                Análisis detallado del rendimiento competitivo · {season.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stats.length > 0 && (
              <DownloadStatsCsv
                stats={stats.map(s => ({
                  name: s.name, number: s.number, position: s.position,
                  gamesPlayed: s.gamesPlayed, goals: s.goals, assists: s.assists,
                  minutes: s.minutes, yellowCards: s.yellowCards, redCards: s.redCards,
                }))}
                seasonName={season.name}
              />
            )}
            {shareToken && <ShareButton token={shareToken} />}
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>Temporada:</span>
            <span className="px-4 py-2 rounded-lg border text-sm font-bold" style={{ backgroundColor: '#191f31', borderColor: '#2e3447', color: '#dce1fb' }}>
              {season.name}
            </span>
          </div>
        </header>

        {/* Filtro por tipo de competición — solo si hay mezcla */}
        {(hasCopaInStats || hasAmistosos) && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {([
              { label: 'Todos', ct: '' },
              { label: 'Competitivos', ct: 'competitive' },
              { label: 'Liga', ct: 'liga' },
              ...(hasCopaInStats ? [{ label: 'Copa', ct: 'copa' }] : []),
            ] as { label: string; ct: string }[]).map(({ label, ct }) => {
              const active = ctParam === ct || (ctParam === 'all' && ct === '')
              const color = '#a78bfa'
              return (
                <a key={ct}
                  href={`/dashboard/season/${seasonId}/stats${ct ? `?ct=${ct}` : ''}`}
                  className="px-4 py-2 rounded-xl text-[11px] font-bold border transition-all"
                  style={{
                    backgroundColor: active ? `${color}15` : 'transparent',
                    borderColor: active ? `${color}40` : '#2e3447',
                    color: active ? color : '#64748b',
                  }}>
                  {label}
                </a>
              )
            })}
            <span className="text-[10px]" style={{ color: '#334155' }}>
              {total} partido{total !== 1 ? 's' : ''}
              {ctParam === 'copa' ? ' de copa' : ctParam === 'liga' ? ' de liga' : ctParam === 'competitive' ? ' competitivos' : ''}
            </span>
          </div>
        )}

        {total === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#2e3447]/50 py-16 text-center">
            <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: '#2e3447' }}>leaderboard</span>
            <p className="text-sm" style={{ color: '#adb4ce' }}>Sin partidos registrados en esta temporada</p>
          </div>
        ) : (
          <>
            {/* Hero: donut + métricas + racha */}
            <section
              className="mb-8 p-6 rounded-2xl border flex flex-col md:flex-row gap-8 items-center relative overflow-hidden"
              style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
            >
              {/* Decoración de fondo */}
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none select-none">
                <span className="material-symbols-outlined" style={{ fontSize: 120 }}>analytics</span>
              </div>

              {/* Donut SVG */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
                    {/* Track */}
                    <circle cx="96" cy="96" r="80" fill="transparent" stroke="#1e293b" strokeWidth="16" />
                    {/* Victorias */}
                    {winPct > 0 && (
                      <circle cx="96" cy="96" r="80" fill="transparent" stroke="#22c55e"
                        strokeDasharray={CIRCUM} strokeDashoffset={winOffset}
                        strokeWidth="16" />
                    )}
                    {/* Empates */}
                    {drawPct > 0 && (
                      <circle cx="96" cy="96" r="80" fill="transparent" stroke="#fbbf24"
                        strokeDasharray={CIRCUM} strokeDashoffset={drawOffset}
                        strokeWidth="16"
                        transform={`rotate(${drawRotation} 96 96)`} />
                    )}
                    {/* Derrotas */}
                    {lossPct > 0 && (
                      <circle cx="96" cy="96" r="80" fill="transparent" stroke="#f87171"
                        strokeDasharray={CIRCUM} strokeDashoffset={lossOffset}
                        strokeWidth="16"
                        transform={`rotate(${lossRotation} 96 96)`} />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-extrabold leading-none"
                      style={{ color: '#4be277', fontFamily: 'Sora, sans-serif', fontSize: winRate === 100 ? 36 : winRate >= 10 ? 44 : 48 }}>
                      {winRate}%
                    </span>
                    <span className="text-[12px] font-bold uppercase tracking-widest mt-1" style={{ color: '#adb4ce' }}>Victorias</span>
                  </div>
                </div>
                <div className="flex gap-4 mt-4">
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" /><span className="text-[10px] font-bold uppercase" style={{ color: '#adb4ce' }}>V</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fbbf24' }} /><span className="text-[10px] font-bold uppercase" style={{ color: '#adb4ce' }}>E</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f87171' }} /><span className="text-[10px] font-bold uppercase" style={{ color: '#adb4ce' }}>D</span></div>
                </div>
                {ligaFinished.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: 'rgba(75,226,119,0.2)', backgroundColor: 'rgba(75,226,119,0.06)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#4be277' }}>emoji_events</span>
                    <span className="text-[10px] font-bold tabular-nums" style={{ color: '#4be277' }}>{ligaPts} pts</span>
                    <span className="text-[9px]" style={{ color: '#334155' }}>liga</span>
                  </div>
                )}
              </div>

              {/* 4 métricas */}
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {([
                  { label: 'Total Victorias', value: wins,         icon: 'trending_up',   sub: `${winRate}% partidos`,    subColor: '#4be277' },
                  { label: 'Goles a Favor',   value: goalsFor,     icon: 'sports_soccer', sub: `${avgFor} p/partido`,      subColor: '#4be277' },
                  { label: 'Goles en Contra', value: goalsAgainst, icon: 'security',      sub: `${avgAgainst} p/partido`, subColor: '#adb4ce' },
                  { label: 'Diferencia',       value: goalDiff > 0 ? `+${goalDiff}` : String(goalDiff), icon: goalDiff >= 0 ? 'add_circle' : 'remove_circle', sub: `${cleanSheets} portería${cleanSheets !== 1 ? 's' : ''} a cero`, subColor: goalDiff > 0 ? '#4be277' : goalDiff < 0 ? '#f87171' : '#adb4ce' },
                ] as const).map(({ label, value, icon, sub, subColor }) => (
                  <div key={label} className="p-4 rounded-lg border"
                    style={{ backgroundColor: 'rgba(7,13,31,0.5)', borderColor: 'rgba(61,74,61,0.3)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#adb4ce' }}>{label}</p>
                    <p className="text-[40px] font-extrabold leading-none text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{value}</p>
                    <p className="text-[10px] font-bold mt-2 flex items-center gap-1" style={{ color: subColor }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{icon}</span>
                      {sub}
                    </p>
                  </div>
                ))}
              </div>

              {/* Racha reciente */}
              {streak.length > 0 && (
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-center md:text-left" style={{ color: '#adb4ce' }}>
                    Racha Reciente
                  </p>
                  <div className="flex md:flex-col gap-2">
                    {streak.slice(0, 5).map((s, i) => (
                      <div key={i}
                        className="w-10 h-10 flex items-center justify-center font-bold rounded-lg text-sm border"
                        style={{
                          backgroundColor: s.win ? 'rgba(75,226,119,0.12)' : s.draw ? 'rgba(251,191,36,0.08)' : 'rgba(248,113,113,0.1)',
                          borderColor:     s.win ? '#22c55e' : s.draw ? 'rgba(251,191,36,0.4)' : 'rgba(248,113,113,0.4)',
                          color:           s.win ? '#4be277' : s.draw ? '#fbbf24' : '#f87171',
                          boxShadow: s.win && i === 0 ? '0 0 10px rgba(34,197,94,0.3)' : 'none',
                        }}
                      >
                        {s.r}
                      </div>
                    ))}
                  </div>
                  {streakLabel && currentStreakCount >= 2 && (
                    <p className="text-[10px] font-bold text-center md:text-left" style={{ color: streakColor }}>
                      {streakLabel}
                    </p>
                  )}
                  {showUnbeaten && (
                    <p className="text-[10px] font-bold text-center md:text-left" style={{ color: '#4be277' }}>
                      Sin perder en {unbeatenRun}
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Callout máximo goleador */}
            {byGoals.length > 0 && (
              <div className="mb-6 rounded-2xl border p-5 flex items-center gap-5 relative overflow-hidden"
                style={{ backgroundColor: '#0f172a', borderColor: 'rgba(34,197,94,0.25)', background: 'linear-gradient(135deg, #0f172a 0%, rgba(34,197,94,0.04) 100%)' }}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />
                <div className="absolute top-0 right-0 p-5 opacity-[0.04] pointer-events-none select-none">
                  <span className="material-symbols-outlined" style={{ fontSize: 96 }}>emoji_events</span>
                </div>
                <PlayerAvatar name={byGoals[0].name} photoUrl={byGoals[0].photoUrl} position={byGoals[0].position} size="lg" className="h-16 w-16 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#4be277' }}>
                    Máxim{terms.p === 'jugador' ? 'o' : 'a'} Goleador{terms.p === 'jugador' ? '' : 'a'}
                  </p>
                  <p className="text-[22px] font-extrabold text-white leading-tight truncate" style={{ fontFamily: 'Sora, sans-serif' }}>
                    {shortName(byGoals[0].name)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#adb4ce' }}>
                    {byGoals[0].gamesPlayed} partidos · {byGoals[0].assists} asistencia{byGoals[0].assists !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[52px] font-extrabold leading-none" style={{ color: '#4be277', fontFamily: 'Sora, sans-serif' }}>
                    {byGoals[0].goals}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#4be277' }}>goles</p>
                </div>
              </div>
            )}

            {/* Ranking de goleadoras con barras horizontales */}
            {byGoals.length > 1 && (
              <section className="mb-8 rounded-2xl border overflow-hidden" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
                <div className="px-6 py-4 border-b border-[#1e293b] flex items-center justify-between">
                  <h3 className="text-[16px] font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                    Ranking Goleadoras
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>
                    {byGoals.length} {byGoals.length === 1 ? terms.p : terms.pp} con goles
                  </span>
                </div>
                <div className="px-6 py-4 flex flex-col gap-3">
                  {byGoals.slice(0, 8).map((s, i) => {
                    const pct = byGoals[0].goals > 0 ? Math.max((s.goals / byGoals[0].goals) * 100, 6) : 0
                    const medal = i === 0 ? '#fbbf24' : i === 1 ? '#adb4ce' : i === 2 ? '#9d8050' : '#475569'
                    const barColor = i === 0 ? '#4be277' : i === 1 ? 'rgba(75,226,119,0.65)' : i === 2 ? 'rgba(75,226,119,0.45)' : 'rgba(75,226,119,0.25)'
                    return (
                      <div key={s.playerId} className="flex items-center gap-3">
                        <span className="w-4 text-center text-[11px] font-black flex-shrink-0 tabular-nums" style={{ color: medal }}>{i + 1}</span>
                        <PlayerAvatar name={s.name} photoUrl={s.photoUrl} position={s.position} size="sm" className="w-7 h-7 flex-shrink-0" />
                        <span className="text-[12px] font-semibold text-white truncate" style={{ minWidth: 80, maxWidth: 120 }}>{shortName(s.name)}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                        </div>
                        <div className="flex-shrink-0 flex items-baseline gap-1.5">
                          <span className="text-[18px] font-extrabold tabular-nums" style={{ color: i === 0 ? '#4be277' : '#adb4ce', fontFamily: 'Sora, sans-serif' }}>{s.goals}</span>
                          {s.assists > 0 && <span className="text-[10px] font-bold" style={{ color: '#475569' }}>+{s.assists}A</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Líderes del Equipo */}
            <h3 className="text-[20px] font-semibold mb-4 pl-4 border-l-4 border-[#22c55e] text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              Líderes del Equipo
            </h3>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">

              {/* Goles */}
              <RankCard title="Goles" icon="workspace_premium"
                players={byGoals.slice(0, 3).map(s => ({ name: s.name, photoUrl: s.photoUrl, position: s.position, primary: s.goals }))}
              />

              {/* Asistencias */}
              <RankCard title="Asistencias" icon="alt_route"
                players={byAssists.slice(0, 3).map(s => ({ name: s.name, photoUrl: s.photoUrl, position: s.position, primary: s.assists }))}
              />

              {/* G+A Contribuciones */}
              <RankCard title="G+A" icon="bolt"
                players={byContribs.slice(0, 3).map(s => ({ name: s.name, photoUrl: s.photoUrl, position: s.position, primary: s.goals + s.assists, sublabel: `${s.goals}G · ${s.assists}A` }))}
              />

              {/* Minutos */}
              <RankCard title="Minutos" icon="timer"
                players={byMinutes.slice(0, 3).map(s => ({ name: s.name, photoUrl: s.photoUrl, position: s.position, primary: s.minutes }))}
                formatValue={(v) => v.toLocaleString('es-ES')}
              />

              {/* Tarjetas */}
              <RankCard title="Tarjetas" icon="style"
                players={byCards.slice(0, 3).map(s => ({
                  name: s.name, photoUrl: s.photoUrl, position: s.position,
                  primary: s.yellowCards + s.redCards,
                  yellowCards: s.yellowCards, redCards: s.redCards,
                  warnCards: s.yellowCards >= YELLOW_WARNING,
                }))}
                showCards
              />

              {/* Partidos o MVP si hay datos */}
              {byMvp.length > 0 ? (
                <RankCard title="Del Partido ⭐" icon="star"
                  players={byMvp.slice(0, 3).map(s => ({ name: s.name, photoUrl: s.photoUrl, position: s.position, primary: mvpCounts.get(s.playerId) ?? 0, sublabel: 'veces' }))}
                />
              ) : (
                <RankCard title="Partidos" icon="stadium"
                  players={byGames.slice(0, 3).map(s => ({ name: s.name, photoUrl: s.photoUrl, position: s.position, primary: s.gamesPlayed }))}
                />
              )}

              {/* Valoración del entrenador — solo si hay datos */}
              {byRating.length > 0 && (
                <RankCard title="Valoración ★" icon="grade"
                  players={byRating.slice(0, 3).map(s => ({
                    name: s.name, photoUrl: s.photoUrl, position: s.position,
                    primary: Math.round(s.avgRating * 10),
                    sublabel: `${s.ratingCount} valoraciones`,
                  }))}
                  formatValue={(v) => (v / 10).toFixed(1) + '★'}
                />
              )}
            </section>

            {/* Casa vs Fuera */}
            {total > 0 && (homeM.length > 0 || awayM.length > 0) && (
              <section className="mb-8 rounded-2xl border p-6" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
                <h3 className="text-[20px] font-semibold mb-5 text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Rendimiento por Campo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Local',     emoji: 'home',       matches: homeM, w: homeW, d: homeD, l: homeL },
                    { label: 'Visitante', emoji: 'flight',     matches: awayM, w: awayW, d: awayD, l: awayL },
                  ].map(({ label, emoji, matches: ms, w, d, l }) => {
                    const t = ms.length
                    const rate = t > 0 ? Math.round((w / t) * 100) : 0
                    const gf = ms.reduce((s, m) => s + m.goals_for, 0)
                    const ga = ms.reduce((s, m) => s + m.goals_against, 0)
                    return (
                      <div key={label} className="rounded-xl border p-4" style={{ backgroundColor: '#070d1f', borderColor: '#1e293b' }}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined" style={{ color: '#4be277', fontSize: 18 }}>{emoji}</span>
                          <p className="text-sm font-bold text-white">{label}</p>
                          <span className="ml-auto text-[10px] font-bold uppercase" style={{ color: '#adb4ce' }}>{t} partido{t !== 1 ? 's' : ''}</span>
                        </div>
                        {t === 0 ? (
                          <p className="text-xs" style={{ color: '#2e3447' }}>Sin datos</p>
                        ) : (
                          <>
                            <div className="flex gap-2 mb-3">
                              {[
                                { v: w, label: 'V', color: '#4be277', bg: 'rgba(75,226,119,0.08)',  border: 'rgba(75,226,119,0.2)' },
                                { v: d, label: 'E', color: '#fbbf24', bg: 'rgba(251,191,36,0.07)', border: 'rgba(251,191,36,0.2)' },
                                { v: l, label: 'D', color: '#f87171', bg: 'rgba(248,113,113,0.05)', border: 'rgba(248,113,113,0.2)' },
                              ].map(({ v, label: lbl, color, bg, border }) => (
                                <div key={lbl} className="flex-1 text-center rounded-lg border py-1.5" style={{ backgroundColor: bg, borderColor: border }}>
                                  <p className="text-lg font-extrabold" style={{ color, fontFamily: 'Sora, sans-serif' }}>{v}</p>
                                  <p className="text-[9px] font-bold uppercase" style={{ color: '#adb4ce' }}>{lbl}</p>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between text-[11px]" style={{ color: '#adb4ce' }}>
                              <span>GF <span style={{ color: '#4be277' }}>{gf}</span> · GC <span style={{ color: '#ffb4ab' }}>{ga}</span></span>
                              <span style={{ color: rate >= 50 ? '#4be277' : '#adb4ce' }}>{rate}% victorias</span>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Goles por partido — gráfico de barras */}
            {last10.length > 0 && (
              <section className="rounded-2xl border p-6" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
                  <div>
                    <h4 className="text-[20px] font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                      Goles por Partido
                    </h4>
                    <p className="text-sm mt-1" style={{ color: '#adb4ce' }}>
                      Rendimiento ofensivo/defensivo · Últimos {last10.length} partidos
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm bg-green-500" />
                      <span className="text-[10px] font-bold uppercase" style={{ color: '#adb4ce' }}>A Favor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(255,180,171,0.5)' }} />
                      <span className="text-[10px] font-bold uppercase" style={{ color: '#adb4ce' }}>En Contra</span>
                    </div>
                  </div>
                </div>

                <div className="h-64 flex items-end justify-between gap-2 relative">
                  {/* Guías horizontales */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.06]">
                    {[0, 1, 2, 3].map(i => <div key={i} className="border-t border-white w-full" />)}
                  </div>

                  {last10.map((m, i) => {
                    const gfPct = maxGoalsBar > 0 ? Math.max((m.goals_for / maxGoalsBar) * 100, m.goals_for > 0 ? 8 : 0) : 0
                    const gaPct = maxGoalsBar > 0 ? Math.max((m.goals_against / maxGoalsBar) * 100, m.goals_against > 0 ? 8 : 0) : 0
                    const label = (m.opponent ?? `P${i + 1}`).slice(0, 9)
                    return (
                      <div key={m.id} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
                        <div className="flex items-end gap-[2px] h-48 w-full justify-center">
                          <div
                            className="w-4 rounded-t-sm transition-all duration-300 group-hover:brightness-125"
                            style={{ height: `${gfPct}%`, backgroundColor: '#22c55e' }}
                          />
                          <div
                            className="w-4 rounded-t-sm transition-all duration-300 group-hover:brightness-125"
                            style={{ height: `${gaPct}%`, backgroundColor: 'rgba(255,180,171,0.4)' }}
                          />
                        </div>
                        <span className="text-[9px] font-bold uppercase truncate max-w-full px-0.5" style={{ color: '#adb4ce' }}>
                          {label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Gráfico de evolución de puntos */}
            {chartPoints.length >= 2 && (
              <section className="mt-8 rounded-2xl border p-6" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
                <div className="flex items-start justify-between mb-6 gap-4">
                  <div>
                    <h4 className="text-[20px] font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                      Evolución de Puntos
                    </h4>
                    <p className="text-sm mt-1" style={{ color: '#adb4ce' }}>
                      Puntos acumulados partido a partido · {cumPts} pts totales
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1e293b', color: '#64748b' }}>Solo Liga</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                      <span className="text-[10px] font-bold uppercase" style={{ color: '#adb4ce' }}>Victoria</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span className="text-[10px] font-bold uppercase" style={{ color: '#adb4ce' }}>Empate</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f87171' }} />
                      <span className="text-[10px] font-bold uppercase" style={{ color: '#adb4ce' }}>Derrota</span>
                    </div>
                  </div>
                </div>
                <EvolutionChart points={chartPoints} />
              </section>
            )}

            {/* Carrera goleadora */}
            {goalRacePlayers.length >= 2 && raceMatchLabels.length >= 2 && (
              <section className="mt-8 rounded-2xl border p-6" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
                  <div>
                    <h4 className="text-[20px] font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                      Carrera Goleadora
                    </h4>
                    <p className="text-sm mt-1" style={{ color: '#adb4ce' }}>
                      Goles acumulados partido a partido · Top {goalRacePlayers.length} goleadoras
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1e293b', color: '#64748b' }}>Liga + Copa</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {goalRacePlayers.map(p => (
                      <div key={p.name} className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="text-[10px] font-bold uppercase" style={{ color: '#adb4ce' }}>
                          {p.name.split(' ')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <GoalRaceChart players={goalRacePlayers} matchLabels={raceMatchLabels} />
              </section>
            )}

            {/* Desglose por competición */}
            {competitions.length >= 2 && (
              <section className="mt-8 rounded-2xl border p-6" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
                <h3 className="text-[20px] font-semibold mb-5 pl-4 border-l-4 border-[#22c55e] text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Por Competición
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {competitions.map(c => {
                    const rate = c.played > 0 ? Math.round((c.W / c.played) * 100) : 0
                    return (
                      <div key={c.name} className="rounded-xl border p-4" style={{ backgroundColor: '#070d1f', borderColor: '#1e293b' }}>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-bold text-white truncate">{c.name}</p>
                          <span className="text-[10px] font-bold uppercase flex-shrink-0 ml-2" style={{ color: '#adb4ce' }}>{c.played} PJ</span>
                        </div>
                        <div className="flex gap-2 mb-2">
                          {[
                            { v: c.W, lbl: 'V', color: '#4be277',  bg: 'rgba(75,226,119,0.08)',    border: 'rgba(75,226,119,0.2)' },
                            { v: c.E, lbl: 'E', color: '#fbbf24',  bg: 'rgba(251,191,36,0.07)',    border: 'rgba(251,191,36,0.2)' },
                            { v: c.D, lbl: 'D', color: '#f87171',  bg: 'rgba(248,113,113,0.05)',   border: 'rgba(248,113,113,0.2)' },
                          ].map(({ v, lbl, color, bg, border }) => (
                            <div key={lbl} className="flex-1 text-center rounded-lg border py-1.5" style={{ backgroundColor: bg, borderColor: border }}>
                              <p className="text-base font-extrabold" style={{ color, fontFamily: 'Sora, sans-serif' }}>{v}</p>
                              <p className="text-[9px] font-bold uppercase" style={{ color: '#adb4ce' }}>{lbl}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-[11px]" style={{ color: '#adb4ce' }}>
                          <span>GF <span style={{ color: '#4be277' }}>{c.gf}</span> · GC <span style={{ color: '#ffb4ab' }}>{c.ga}</span></span>
                          <span style={{ color: rate >= 50 ? '#4be277' : '#adb4ce' }}>{rate}% vic.</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── Rendimiento por posición ──────────────────── */}
            {byPosition.length >= 2 && (
              <section className="mt-8 rounded-2xl border p-6" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
                <h3 className="text-[20px] font-semibold mb-5 pl-4 border-l-4 border-[#22c55e] text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Rendimiento por Posición
                </h3>
                <div className="flex flex-col gap-3">
                  {byPosition.map(p => {
                    const barPct = Math.round((p.goals / maxPosGoals) * 100)
                    const avgMin = p.players.size > 0 ? Math.round(p.minutes / p.players.size) : 0
                    return (
                      <div key={p.position} className="rounded-xl border p-4" style={{ backgroundColor: '#070d1f', borderColor: '#1e293b' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{p.position}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: 'rgba(75,226,119,0.1)', color: '#4be277', border: '1px solid rgba(75,226,119,0.15)' }}>
                              {p.players.size} {terms.pp}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs" style={{ color: '#adb4ce' }}>
                            <span><span style={{ color: '#4be277', fontWeight: 700 }}>{p.goals}</span> G</span>
                            <span><span style={{ color: '#facc15', fontWeight: 700 }}>{p.assists}</span> A</span>
                            <span className="hidden sm:inline"><span style={{ color: '#60a5fa', fontWeight: 700 }}>{avgMin}&apos;</span> media</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${barPct}%`, backgroundColor: '#22c55e' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── H2H por rival ──────────────────────────────── */}
            {h2h.length > 0 && (
              <section className="mt-8">
                <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#adb4ce' }}>
                  Historial por rival
                </h3>
                <div className="overflow-hidden rounded-[20px] border border-[#1e293b]" style={{ backgroundColor: '#0f172a' }}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1e293b]" style={{ backgroundColor: '#151b2d' }}>
                        {['Rival', 'PJ', 'V', 'E', 'D', 'GF', 'GC', 'Últ.'].map((h, i) => (
                          <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest"
                            style={{ color: '#adb4ce', textAlign: i === 0 ? 'left' : 'center' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {h2h.map(r => {
                        const lastColor = r.lastResult === 'V' ? '#4be277' : r.lastResult === 'D' ? '#f87171' : '#fbbf24'
                        const lastBg = r.lastResult === 'V' ? 'rgba(75,226,119,0.12)' : r.lastResult === 'D' ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.08)'
                        return (
                          <tr key={r.opponent} className="border-b border-[#1e293b] last:border-0 hover:bg-[#23293c]/30 transition-colors">
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-white">{r.opponent}</p>
                            </td>
                            {[r.played, r.W, r.E, r.D, r.gf, r.ga].map((v, i) => (
                              <td key={i} className="px-4 py-3 text-center">
                                <span className="text-sm font-bold" style={{
                                  color: i === 1 ? '#4be277' : i === 2 ? '#fbbf24' : i === 3 ? '#f87171' : '#dce1fb'
                                }}>{v}</span>
                              </td>
                            ))}
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-black"
                                style={{ backgroundColor: lastBg, color: lastColor }}>
                                {r.lastResult}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            {/* ── Tabla completa de estadísticas ── */}
            {stats.filter(s => s.gamesPlayed > 0).length > 0 && (
              <section className="mt-8 rounded-2xl border overflow-hidden" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
                <div className="px-6 py-4 border-b border-[#1e293b]">
                  <h3 className="text-[20px] font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                    Tabla de rendimiento
                  </h3>
                  <p className="text-sm mt-0.5" style={{ color: '#adb4ce' }}>
                    Haz clic en una columna para ordenar · G/90 para {terms.pp} con más de 45 min
                  </p>
                </div>
                <SortableStatsTable
                  stats={stats}
                  playerLabel={terms.p.charAt(0).toUpperCase() + terms.p.slice(1)}
                  teamId={team.id}
                />
              </section>
            )}

            {/* Comparar jugadoras */}
            {compareStats.length >= 2 && (
              <section className="mt-8 rounded-2xl border p-6" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
                <h3 className="text-[20px] font-semibold mb-1 pl-4 border-l-4 border-[#22c55e] text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Comparar Jugadoras
                </h3>
                <p className="text-sm mb-6 ml-4" style={{ color: '#adb4ce' }}>
                  Selecciona dos jugadoras para ver sus estadísticas cara a cara
                </p>
                <PlayerCompare players={compareStats} />
              </section>
            )}
          </>
        )}

        {/* ── Asistencia a Entrenamientos — independiente del filtro de partidos ── */}
        {attStats.length > 0 && (
          <section className="mt-8">
            <h3 className="text-[20px] font-semibold mb-1 pl-4 border-l-4 border-[#22c55e] text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              Asistencia a Entrenamientos
            </h3>
            <p className="text-sm mb-4 ml-4" style={{ color: '#adb4ce' }}>
              {sessionIds.length} sesión{sessionIds.length !== 1 ? 'es' : ''} · {avgAttPct}% asistencia media del equipo
            </p>
            <div className="overflow-hidden rounded-[20px] border" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
              {attStats.map((s, i) => {
                const pct = Math.round((s.attended / s.total) * 100)
                const barColor  = pct >= 80 ? '#22c55e' : pct >= 60 ? '#eab308' : '#ef4444'
                const textColor = pct >= 80 ? '#4be277' : pct >= 60 ? '#facc15' : '#f87171'
                return (
                  <div key={s.playerId}
                    className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                    style={{ borderColor: '#1e293b' }}>
                    <span className="w-5 text-center text-[11px] font-black flex-shrink-0"
                      style={{ color: i === 0 ? '#4be277' : i < 3 ? '#adb4ce' : '#475569' }}>
                      {i + 1}
                    </span>
                    <PlayerAvatar name={s.name} photoUrl={s.photoUrl} position={s.position} size="sm" />
                    <p className="flex-1 min-w-0 truncate text-sm font-semibold text-white">
                      {shortName(s.name)}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-16 sm:w-28 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: barColor }} />
                      </div>
                      <span className="text-xs font-bold tabular-nums" style={{ color: textColor }}>
                        {s.attended}/{s.total}
                      </span>
                      <span className="text-xs font-black tabular-nums w-10 text-right"
                        style={{ color: textColor }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </PageTransition>
  )
}

// ─── Componentes helper ────────────────────────────────────────────────────────

type RankPlayer = {
  name: string
  photoUrl?: string | null
  position?: string | null
  primary: number
  sublabel?: string
  yellowCards?: number
  redCards?: number
  warnCards?: boolean
}

function RankCard({
  title, icon, players, showCards, formatValue,
}: {
  title: string
  icon: string
  players: RankPlayer[]
  showCards?: boolean
  formatValue?: (v: number) => string
}) {
  const fmt = formatValue ?? String

  return (
    <div className="rounded-[16px] border p-4 transition-all duration-200 hover:border-[#22c55e]/40"
      style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>{title}</h4>
        <span className="material-symbols-outlined" style={{ color: '#4be277', fontSize: 20 }}>{icon}</span>
      </div>

      {players.length === 0 ? (
        <p className="text-[11px] text-center py-3" style={{ color: '#adb4ce' }}>Sin datos</p>
      ) : (
        <div className="flex flex-col gap-3">
          {players.map((p, i) => {
            const pct = !showCards && players[0].primary > 0 ? Math.max((p.primary / players[0].primary) * 100, 8) : 0
            return (
              <div key={p.name + i} style={{ opacity: i === 0 ? 1 : i === 1 ? 0.82 : 0.65 }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <PlayerAvatar name={p.name} photoUrl={p.photoUrl} position={p.position ?? undefined} size="sm" />
                    <span className="text-sm truncate" style={{ color: '#dce1fb' }}>{shortName(p.name)}</span>
                  </div>

                  {showCards ? (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {(p.yellowCards ?? 0) > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="w-3 h-4 rounded-sm bg-yellow-400" style={{ boxShadow: p.warnCards ? '0 0 6px rgba(250,204,21,0.5)' : 'none' }} />
                          <span className="text-sm font-bold" style={{ color: '#dce1fb' }}>{p.yellowCards}</span>
                        </div>
                      )}
                      {(p.redCards ?? 0) > 0 && (
                        <div className="flex items-center gap-1 ml-1">
                          <span className="w-3 h-4 rounded-sm bg-red-500" />
                          <span className="text-sm font-bold" style={{ color: '#dce1fb' }}>{p.redCards}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-[20px] font-bold leading-none" style={{ color: '#4be277', fontFamily: 'Sora, sans-serif' }}>
                        {fmt(p.primary)}
                      </span>
                      {p.sublabel && (
                        <span className="text-[9px] font-bold uppercase mt-0.5" style={{ color: '#4be277', opacity: 0.6 }}>{p.sublabel}</span>
                      )}
                    </div>
                  )}
                </div>
                {!showCards && (
                  <div className="h-[2px] rounded-full overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#22c55e', opacity: i === 0 ? 0.7 : i === 1 ? 0.5 : 0.35 }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
