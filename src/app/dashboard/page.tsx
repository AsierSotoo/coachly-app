import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { PageTransition } from '@/components/ui/page-transition'
import { TeamLogo } from '@/components/team/team-logo'
import { OnboardingGuide } from '@/components/ui/onboarding-guide'
import { AnimatedList, AnimatedItem } from '@/components/ui/animated-card'

type Match = {
  id: string
  goals_for: number
  goals_against: number
  opponent: string
  played_at: string
  match_time?: string | null
  status?: string
  competition_type?: string
  home?: boolean
}

type Season = {
  id: string
  name: string
  created_at: string
  league_position?: number | null
  league_total_teams?: number | null
  matches: Match[]
  training_sessions: { id: string; date: string; title: string | null; location?: string | null }[]
}

type Team = {
  id: string
  name: string
  category?: string | null
  gender?: string | null
  logo_url?: string | null
  seasons: Season[]
  players: { id: string; active: boolean }[]
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const todayStr = new Date().toISOString().split('T')[0]

  const { data: raw } = await supabase
    .from('teams')
    .select('*, seasons(id, name, created_at, league_position, league_total_teams, matches(id, goals_for, goals_against, opponent, played_at, match_time, status, competition_type, home), training_sessions(id, date, title)), players(id, active)')
    .order('created_at', { ascending: true })

  const teams = (raw ?? []) as Team[]

  // Datos extra para el equipo principal
  const primaryTeam = teams.length === 1 ? teams[0] : null
  const primarySeason = primaryTeam
    ? [...(primaryTeam.seasons ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
    : null
  const nextMatchId = primarySeason?.matches?.filter(m => m.status === 'scheduled').sort((a, b) => a.played_at.localeCompare(b.played_at))[0]?.id ?? null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [yellowRows, availRows, topScorerRows] = await Promise.all([
    // Amarillas acumuladas
    primarySeason?.id
      ? supabase.from('matches').select('appearances(player_id, yellow_cards, players(name, active))').eq('season_id', primarySeason.id).neq('status', 'scheduled')
      : Promise.resolve({ data: null }),
    // Disponibilidad próximo partido
    nextMatchId
      ? (supabase.from('match_availability') as unknown as { select: (q: string) => { eq: (a: string, b: string) => Promise<{ data: { player_id: string; status: string }[] | null }> } }).select('player_id, status').eq('match_id', nextMatchId)
      : Promise.resolve({ data: null }),
    // Máxima goleadora temporada
    primarySeason?.id
      ? supabase.from('appearances').select('player_id, goals, players(name, position)').in('match_id', primarySeason.matches.map(m => m.id)).gt('goals', 0).order('goals', { ascending: false }).limit(1)
      : Promise.resolve({ data: null }),
  ])

  // Alertas amarillas
  type YellowAlert = { playerId: string; name: string; count: number }
  let yellowAlerts: YellowAlert[] = []
  if (yellowRows.data) {
    const playerMap = new Map<string, { name: string; count: number }>()
    for (const m of yellowRows.data as unknown as { appearances: { player_id: string; yellow_cards: number; players: { name: string; active: boolean } | null }[] }[]) {
      for (const a of m.appearances ?? []) {
        if (a.players?.active === false) continue
        const curr = playerMap.get(a.player_id) ?? { name: a.players?.name ?? '', count: 0 }
        curr.count += a.yellow_cards ?? 0
        playerMap.set(a.player_id, curr)
      }
    }
    yellowAlerts = [...playerMap.entries()].map(([playerId, d]) => ({ playerId, name: d.name, count: d.count })).filter(p => p.count >= 4).sort((a, b) => b.count - a.count)
  }

  // Disponibilidad
  const availData = availRows.data as { player_id: string; status: string }[] | null
  const availCount = availData?.filter(r => r.status === 'available').length ?? 0
  const totalActive = primaryTeam?.players.filter(p => p.active).length ?? 0

  // Top scorer
  type TopScorer = { name: string; goals: number; position: string | null }
  const topScorerData = topScorerRows.data as unknown as { player_id: string; goals: number; players: { name: string; position: string | null } }[] | null
  const topScorer: TopScorer | null = topScorerData?.[0]
    ? { name: topScorerData[0].players.name, goals: topScorerData[0].goals, position: topScorerData[0].players.position }
    : null

  function processTeam(team: Team) {
    const lastSeason = [...team.seasons].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
    const allMatches = lastSeason?.matches ?? []
    const finished = allMatches.filter(m => m.status !== 'scheduled')
    const competitive = finished.filter(m => (m.competition_type ?? 'liga') !== 'amistoso')
    const ligaOnly = competitive.filter(m => (m.competition_type ?? 'liga') === 'liga')
    const sorted = [...competitive].sort((a, b) => b.played_at.localeCompare(a.played_at))
    const lastMatch = [...finished].sort((a, b) => b.played_at.localeCompare(a.played_at))[0] ?? null

    const wins   = competitive.filter(m => m.goals_for > m.goals_against).length
    const draws  = competitive.filter(m => m.goals_for === m.goals_against).length
    const losses = competitive.filter(m => m.goals_for < m.goals_against).length
    const goalsFor     = competitive.reduce((s, m) => s + m.goals_for, 0)
    const goalsAgainst = competitive.reduce((s, m) => s + m.goals_against, 0)
    const points = ligaOnly.filter(m => m.goals_for > m.goals_against).length * 3 +
                   ligaOnly.filter(m => m.goals_for === m.goals_against).length
    const playerCount = team.players.filter(p => p.active).length
    const recentForm  = [...sorted].slice(0, 5).reverse()

    let streakCount = 0
    let streakType: 'V' | 'D' | 'E' | null = null
    for (const m of sorted) {
      const r: 'V' | 'D' | 'E' = m.goals_for > m.goals_against ? 'V' : m.goals_for < m.goals_against ? 'D' : 'E'
      if (!streakType) { streakType = r; streakCount = 1 }
      else if (r === streakType) { streakCount++ }
      else { break }
    }

    const nextMatch = allMatches.filter(m => m.status === 'scheduled').sort((a, b) => a.played_at.localeCompare(b.played_at))[0] ?? null
    const nextSession = [...(lastSeason?.training_sessions ?? [])].filter(s => s.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
    const seasonHref = team.seasons.length === 1 ? `/dashboard/season/${team.seasons[0].id}` : `/dashboard/team/${team.id}/seasons`
    const leaguePos = lastSeason?.league_position ?? null

    const matchIndex = allMatches.filter(m => m.status !== 'scheduled').length

    return { lastSeason, allMatches, competitive, sorted, lastMatch, wins, draws, losses, goalsFor, goalsAgainst, points, playerCount, recentForm, streakCount, streakType, nextMatch, nextSession, seasonHref, leaguePos, matchIndex }
  }

  const firstTeam   = teams[0]
  const firstSeasons = firstTeam?.seasons ?? []
  const firstSeason = firstSeasons[0]

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-[620px] lg:max-w-[1040px] px-4 pt-6 pb-32 md:px-6 md:pt-10 md:pb-16">

        {/* ── EMPTY STATE ────────────────────────────────── */}
        {!teams.length && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[22px] border"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)' }}>
              <span className="material-symbols-outlined text-5xl" style={{ color: 'var(--accent)' }}>sports_soccer</span>
            </div>
            <div>
              <h1 className="text-[28px] font-bold tracking-[-0.035em]" style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>Empieza aquí</h1>
              <p className="mx-auto mt-2 max-w-[260px] text-[15px] leading-relaxed" style={{ color: 'var(--tx-2)' }}>
                Crea tu equipo para llevar las estadísticas de la temporada
              </p>
            </div>
            <Link href="/dashboard/team/new"
              className="flex items-center gap-2 rounded-[12px] px-7 py-3 text-sm font-bold transition-all active:scale-95"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)', fontFamily: 'Sora, sans-serif' }}>
              <span className="material-symbols-outlined text-base">add</span>
              Crear mi equipo
            </Link>
          </div>
        )}

        {/* ── HAS TEAMS ──────────────────────────────────── */}
        {!!teams.length && (
          <>
            <OnboardingGuide
              hasTeam={true}
              hasPlayers={firstTeam?.players?.some(p => p.active) ?? false}
              hasSeason={firstSeasons.length > 0}
              hasMatches={(firstSeason?.matches?.length ?? 0) > 0}
              teamId={firstTeam?.id}
              seasonId={firstSeason?.id}
            />

            {/* ── SINGLE TEAM ─────────────────────────────── */}
            {teams.length === 1 && (() => {
              const team = teams[0]
              const { lastSeason, competitive, lastMatch, wins, draws, losses, goalsFor, goalsAgainst, points, playerCount, recentForm, streakCount, streakType, nextMatch, nextSession, seasonHref, leaguePos, matchIndex } = processTeam(team)

              const streakColor = streakType === 'V' ? '#72e697' : streakType === 'D' ? '#f87171' : '#fbbf24'
              const streakLabel = streakCount >= 3
                ? (streakType === 'V' ? `${streakCount}V seguidas` : streakType === 'D' ? `${streakCount}D seguidas` : `${streakCount}E seguidas`)
                : null

              const diff = goalsFor - goalsAgainst

              // Iniciales del rival para el VS card
              const opponentInitials = (name: string) =>
                name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()

              // Fecha formateada del próximo partido
              const nextMatchDate = nextMatch
                ? new Date(nextMatch.played_at + 'T12:00:00')
                : null
              const nextMatchDayShort = nextMatchDate?.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase() ?? ''
              const nextMatchDay = nextMatchDate?.toLocaleDateString('es-ES', { weekday: 'long' }).replace(/^\w/, c => c.toUpperCase()) ?? ''
              const nextMatchTime = nextMatch?.match_time?.slice(0, 5) ?? null

              const heroLastMatch = !nextMatch && lastMatch
              const heroColor = heroLastMatch
                ? (lastMatch!.goals_for > lastMatch!.goals_against ? '#72e697' : lastMatch!.goals_for < lastMatch!.goals_against ? '#f87171' : '#fbbf24')
                : null

              return (
                <div className="space-y-3">

                  {/* ── Identidad del equipo ─────────────────── */}
                  <div className="flex items-center gap-3">
                    <div className="h-[52px] w-[52px] flex-shrink-0 overflow-hidden rounded-[13px] border flex items-center justify-center"
                      style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)' }}>
                      <TeamLogo name={team.name} logoUrl={team.logo_url} size="lg" className="h-10 w-10" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="truncate text-[20px] font-extrabold leading-tight tracking-[-0.03em]"
                          style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>
                          {team.name}
                        </h1>
                        {streakLabel && (
                          <span className="flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
                            style={{ backgroundColor: `${streakColor}18`, color: streakColor, border: `1px solid ${streakColor}30` }}>
                            {streakLabel}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px]" style={{ color: 'var(--tx-3)' }}>
                        {lastSeason?.name ?? 'Sin temporada activa'}
                        {(team.category ?? team.gender) ? ` · ${team.category ?? team.gender}` : ''}
                      </p>
                    </div>
                    {/* Desktop: 2 botones inline */}
                    {lastSeason && (
                      <div className="hidden lg:flex gap-2 flex-shrink-0">
                        <Link href={`/dashboard/season/${lastSeason.id}/convocatorias/new`}
                          className="flex items-center gap-1.5 rounded-[10px] border px-3.5 text-[12px] font-semibold transition-all hover:border-[var(--bdr-strong)] active:scale-[.97]"
                          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr)', color: 'var(--tx-2)', height: 36 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--accent)' }}>assignment</span>
                          Convocatoria
                        </Link>
                        <Link href={`/dashboard/season/${lastSeason.id}/trainings/new`}
                          className="flex items-center gap-1.5 rounded-[10px] border px-3.5 text-[12px] font-semibold transition-all hover:border-[var(--bdr-strong)] active:scale-[.97]"
                          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr)', color: 'var(--tx-2)', height: 36 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--accent)' }}>fitness_center</span>
                          Entrenamiento
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* ── Quick actions (solo móvil) ─────────────── */}
                  {lastSeason && (
                    <div className="grid grid-cols-4 gap-2 lg:hidden">
                      {[
                        { icon: 'assignment', label: 'Convocar', href: `/dashboard/season/${lastSeason.id}/convocatorias/new` },
                        { icon: 'fitness_center', label: 'Entreno', href: `/dashboard/season/${lastSeason.id}/trainings/new` },
                        { icon: 'bar_chart', label: 'Stats', href: `/dashboard/season/${lastSeason.id}/stats` },
                        { icon: 'people', label: 'Disponib.', href: `/dashboard/season/${lastSeason.id}/convocatorias/new` },
                      ].map(({ icon, label, href }) => (
                        <Link key={label} href={href}
                          className="flex flex-col items-center gap-1.5 rounded-[12px] border py-3 transition-all active:scale-[.97]"
                          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr)', boxShadow: 'var(--shadow-card)' }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 20 }}>{icon}</span>
                          <span className="text-[10px] font-bold" style={{ color: 'var(--tx-2)' }}>{label}</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* ── Layout con sidebar ───────────────────── */}
                  <div className="lg:grid lg:grid-cols-[1fr_296px] lg:gap-5 lg:items-start space-y-3 lg:space-y-0">
                  <div className="space-y-3">

                  {/* ── Próximo partido — VS card ─────────────── */}
                  {nextMatch && lastSeason && (
                    <Link href={`/dashboard/season/${lastSeason.id}/match/${nextMatch.id}`}
                      className="block overflow-hidden rounded-[16px] border transition-all active:scale-[.99]"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)', boxShadow: 'var(--shadow-card)' }}>

                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--bdr)', backgroundColor: 'var(--bg-card-2)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-3)' }}>
                          {nextMatchDay}{nextMatchTime ? ` · ${nextMatchTime}h` : ''}
                        </p>
                        <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border"
                          style={{ color: '#72e697', borderColor: 'rgba(114,230,151,0.25)', backgroundColor: 'rgba(114,230,151,0.08)' }}>
                          {nextMatch.competition_type === 'copa' ? 'COPA' : nextMatch.competition_type === 'amistoso' ? 'AMISTOSO' : 'LIGA'}
                        </span>
                      </div>

                      <div className="px-4 pt-3 pb-4">
                        <p className="text-[9px] font-extrabold uppercase tracking-[.14em] mb-4" style={{ color: '#fbbf24' }}>
                          Próximo partido
                        </p>

                        {/* VS */}
                        <div className="flex items-center justify-between gap-2">
                          {/* Nuestro equipo */}
                          <div className="flex flex-col items-center gap-1.5" style={{ flex: '1', minWidth: 0 }}>
                            <div className="w-14 h-14 rounded-full border-2 overflow-hidden flex items-center justify-center flex-shrink-0"
                              style={{ borderColor: 'var(--bdr-strong)', backgroundColor: 'var(--bg-elevated)' }}>
                              {team.logo_url
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={team.logo_url} alt={team.name} className="w-full h-full object-contain p-1" />
                                : <span className="text-[17px] font-black" style={{ color: 'var(--tx-2)' }}>
                                    {team.name.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase()}
                                  </span>
                              }
                            </div>
                            <p className="text-[10px] font-semibold text-center w-full truncate" style={{ color: 'var(--tx-2)' }}>{team.name}</p>
                          </div>

                          {/* Center */}
                          <div className="flex flex-col items-center flex-shrink-0 w-20">
                            <span className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--tx-4)' }}>J{matchIndex + 1}</span>
                            <span className="text-[26px] font-black leading-none" style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>VS</span>
                            {nextMatch.home !== undefined && (
                              <span className="text-[9px] mt-1" style={{ color: 'var(--tx-4)' }}>{nextMatch.home ? 'Local' : 'Visitante'}</span>
                            )}
                          </div>

                          {/* Rival */}
                          <div className="flex flex-col items-center gap-1.5" style={{ flex: '1', minWidth: 0 }}>
                            <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                              style={{ borderColor: 'var(--bdr-strong)', backgroundColor: 'var(--bg-elevated)' }}>
                              <span className="text-[17px] font-black" style={{ color: 'var(--tx-2)' }}>
                                {opponentInitials(nextMatch.opponent)}
                              </span>
                            </div>
                            <p className="text-[10px] font-semibold text-center w-full truncate" style={{ color: 'var(--tx-2)' }}>{nextMatch.opponent}</p>
                          </div>
                        </div>

                        {/* Disponibles — siempre visible */}
                        {totalActive > 0 && (
                          <div className="mt-4 flex items-center justify-between rounded-[10px] border px-3.5 py-2.5"
                            style={availCount > 0
                              ? { backgroundColor: 'rgba(114,230,151,0.08)', borderColor: 'rgba(114,230,151,0.25)' }
                              : { backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr)' }}>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined" style={{ fontSize: 15, color: availCount > 0 ? '#72e697' : 'var(--tx-4)' }}>group</span>
                              <span className="text-[12px] font-bold" style={{ color: availCount > 0 ? '#72e697' : 'var(--tx-3)' }}>
                                {availCount > 0 ? `${availCount} de ${totalActive} disponibles` : 'Sin respuestas de disponibilidad'}
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold" style={{ color: availCount > 0 ? '#72e697' : 'var(--tx-4)' }}>
                              {availCount > 0 ? 'Preparar convocatoria →' : 'Convocar →'}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  )}

                  {/* ── Último partido (fila compacta, cuando hay próximo) ── */}
                  {nextMatch && lastMatch && lastSeason && (() => {
                    const lc = lastMatch.goals_for > lastMatch.goals_against ? '#72e697' : lastMatch.goals_for < lastMatch.goals_against ? '#f87171' : '#fbbf24'
                    const ll = lastMatch.goals_for > lastMatch.goals_against ? 'Victoria' : lastMatch.goals_for < lastMatch.goals_against ? 'Derrota' : 'Empate'
                    return (
                      <Link href={`/dashboard/season/${lastSeason.id}/match/${lastMatch.id}`}
                        className="flex items-center gap-3 rounded-[12px] border px-4 py-2.5 transition-all active:scale-[.99]"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr)', boxShadow: 'var(--shadow-card)' }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--tx-4)' }}>Último partido</p>
                          <p className="text-[13px] font-bold">
                            <span style={{ color: lc }}>{ll} {lastMatch.goals_for}–{lastMatch.goals_against}</span>
                            {' '}<span style={{ color: 'var(--tx-2)' }}>vs {lastMatch.opponent}</span>
                          </p>
                        </div>
                        <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 16, color: 'var(--tx-4)' }}>chevron_right</span>
                      </Link>
                    )
                  })()}

                  {/* ── Último resultado (card grande, sin próximo partido) ── */}
                  {!nextMatch && lastMatch && lastSeason && heroColor && (
                    <Link href={`/dashboard/season/${lastSeason.id}/match/${lastMatch.id}`}
                      className="block overflow-hidden rounded-[16px] border transition-all active:scale-[.99]"
                      style={{ backgroundColor: `${heroColor}06`, borderColor: `${heroColor}20`, boxShadow: 'var(--shadow-card)' }}>
                      <div className="px-5 pt-4 pb-3">
                        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[.12em]" style={{ color: heroColor }}>
                          Último partido
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 leading-none">
                            <span className="text-[52px] font-black tabular-nums" style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif', lineHeight: 1 }}>{lastMatch.goals_for}</span>
                            <span className="text-[28px] font-black" style={{ color: 'var(--bdr-strong)' }}>–</span>
                            <span className="text-[52px] font-black tabular-nums" style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif', lineHeight: 1 }}>{lastMatch.goals_against}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold mb-1"
                              style={{ backgroundColor: `${heroColor}18`, color: heroColor, border: `1px solid ${heroColor}30` }}>
                              {lastMatch.goals_for > lastMatch.goals_against ? 'Victoria' : lastMatch.goals_for < lastMatch.goals_against ? 'Derrota' : 'Empate'}
                            </span>
                            <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--tx-2)' }}>vs {lastMatch.opponent}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--tx-3)' }}>
                              {new Date(lastMatch.played_at + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="border-t flex items-center gap-1 px-5 py-2.5" style={{ borderColor: `${heroColor}14` }}>
                        <span className="text-[12px] font-semibold" style={{ color: heroColor }}>Ver partido</span>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: heroColor }}>chevron_right</span>
                      </div>
                    </Link>
                  )}

                  {/* Sin partidos */}
                  {!nextMatch && !lastMatch && (
                    <Link href={seasonHref}
                      className="flex flex-col items-center justify-center gap-2.5 rounded-[16px] border border-dashed py-10 text-center transition-all"
                      style={{ borderColor: 'var(--bdr-strong)' }}>
                      <span className="material-symbols-outlined text-[32px]" style={{ color: 'var(--tx-4)' }}>sports_soccer</span>
                      <p className="text-[14px] font-semibold" style={{ color: 'var(--tx-3)' }}>Sin partidos registrados</p>
                      <p className="text-[12px] px-6 leading-5" style={{ color: 'var(--tx-4)' }}>Añade el primer partido de la temporada</p>
                    </Link>
                  )}

                  {/* ── Stats: 3 grandes columnas ─────────────── */}
                  {competitive.length > 0 && (
                    <div className="overflow-hidden rounded-[14px] border" style={{ backgroundColor: 'var(--bg-card-2)', borderColor: 'var(--bdr)', boxShadow: 'var(--shadow-card)' }}>
                      <div className="grid grid-cols-3">
                        <div className="flex flex-col items-center py-5">
                          <span className="text-[40px] font-black tabular-nums leading-none" style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>{points}</span>
                          <span className="text-[8px] font-bold uppercase tracking-widest mt-2" style={{ color: 'var(--tx-4)' }}>PUNTOS</span>
                        </div>
                        <div className="flex flex-col items-center py-5 border-x" style={{ borderColor: 'var(--bdr)' }}>
                          <span className="text-[40px] font-black tabular-nums leading-none" style={{ color: diff > 0 ? '#72e697' : diff < 0 ? '#f87171' : 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                          <span className="text-[8px] font-bold uppercase tracking-widest mt-2" style={{ color: 'var(--tx-4)' }}>DIFERENCIA</span>
                        </div>
                        <div className="flex flex-col items-center py-5">
                          <span className="text-[40px] font-black tabular-nums leading-none" style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>
                            {leaguePos ? `${leaguePos}°` : '—'}
                          </span>
                          <span className="text-[8px] font-bold uppercase tracking-widest mt-2" style={{ color: 'var(--tx-4)' }}>POSICIÓN</span>
                        </div>
                      </div>
                      {/* Barra de forma */}
                      {(wins + draws + losses) > 0 && (
                        <div className="flex h-[3px]">
                          {wins   > 0 && <div style={{ flex: wins,   backgroundColor: '#72e697' }} />}
                          {draws  > 0 && <div style={{ flex: draws,  backgroundColor: '#fbbf24', opacity: 0.8 }} />}
                          {losses > 0 && <div style={{ flex: losses, backgroundColor: '#f87171', opacity: 0.7 }} />}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Forma + Entreno (móvil: 2 columnas) ────── */}
                  {(recentForm.length > 0 || nextSession) && (
                    <div className="lg:hidden grid gap-2" style={{ gridTemplateColumns: recentForm.length > 0 && nextSession ? '1fr 1fr' : '1fr' }}>
                      {recentForm.length > 0 && (
                        <div className="rounded-[12px] border p-3.5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr)', boxShadow: 'var(--shadow-card)' }}>
                          <p className="text-[9px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--tx-4)' }}>Últimos {recentForm.length}</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {recentForm.map((m, i) => {
                              const res: 'V' | 'E' | 'D' = m.goals_for > m.goals_against ? 'V' : m.goals_for < m.goals_against ? 'D' : 'E'
                              const s = { V: { bg: '#72e697', text: '#07140c' }, E: { bg: 'var(--bg-elevated)', text: 'var(--tx-2)' }, D: { bg: 'rgba(248,113,113,0.18)', text: '#f87171' } }[res]
                              return <span key={i} className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black" style={{ backgroundColor: s.bg, color: s.text }}>{res}</span>
                            })}
                          </div>
                        </div>
                      )}
                      {nextSession && lastSeason && (
                        <Link href={`/dashboard/season/${lastSeason.id}/trainings`}
                          className="rounded-[12px] border p-3.5 flex flex-col justify-center transition-all active:scale-[.98]"
                          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr)', boxShadow: 'var(--shadow-card)' }}>
                          <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--tx-4)' }}>Próx. entreno</p>
                          <p className="text-[12px] font-bold" style={{ color: 'var(--tx)' }}>
                            {new Date(nextSession.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long' }).replace(/^\w/, c => c.toUpperCase())}
                          </p>
                          {nextSession.title && (
                            <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--tx-3)' }}>{nextSession.title}</p>
                          )}
                        </Link>
                      )}
                    </div>
                  )}

                  {/* ── Forma reciente (solo desktop) ─────────── */}
                  {recentForm.length > 0 && (
                    <div className="hidden lg:flex items-center justify-between px-1">
                      <div>
                        <p className="mb-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-3)' }}>Forma reciente</p>
                        <div className="flex gap-1.5">
                          {recentForm.map((m, i) => {
                            const res: 'V' | 'E' | 'D' = m.goals_for > m.goals_against ? 'V' : m.goals_for < m.goals_against ? 'D' : 'E'
                            const s = { V: { bg: '#72e697', text: '#07140c' }, E: { bg: 'var(--bg-elevated)', text: 'var(--tx-2)' }, D: { bg: 'rgba(248,113,113,0.18)', text: '#f87171' } }[res]
                            return <span key={i} className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black" style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.bg}40` }}>{res}</span>
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="mb-1 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-3)' }}>Goles</p>
                        <p className="font-extrabold tabular-nums leading-none" style={{ fontFamily: 'Sora, sans-serif', fontSize: 18 }}>
                          <span style={{ color: '#72e697' }}>{goalsFor}</span>
                          <span style={{ color: 'var(--bdr-strong)' }}> — </span>
                          <span style={{ color: '#f87171' }}>{goalsAgainst}</span>
                        </p>
                        <p className="text-[9px] mt-0.5" style={{ color: 'var(--tx-4)' }}>a favor — en contra</p>
                      </div>
                    </div>
                  )}

                  </div>

                  {/* ── Sidebar: Esta semana ─────────────────── */}
                  <div className="hidden lg:flex lg:flex-col lg:gap-2.5">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest mb-1" style={{ color: 'var(--tx-4)' }}>Esta semana</p>

                    {nextSession && (
                      <Link href={`/dashboard/season/${lastSeason!.id}/trainings`}
                        className="flex items-start gap-2.5 rounded-[12px] border px-3.5 py-3 transition-all hover:border-[var(--bdr-strong)]"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr)', boxShadow: 'var(--shadow-card)' }}>
                        <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)', fontSize: 16 }}>fitness_center</span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold truncate" style={{ color: 'var(--tx)' }}>
                            Entreno · {new Date(nextSession.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                          </p>
                        </div>
                      </Link>
                    )}

                    {nextMatch && totalActive > 0 && (
                      <Link href={`/dashboard/season/${lastSeason!.id}/match/${nextMatch.id}`}
                        className="flex items-start gap-2.5 rounded-[12px] border px-3.5 py-3 transition-all hover:border-[var(--bdr-strong)]"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr)', boxShadow: 'var(--shadow-card)' }}>
                        <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)', fontSize: 16 }}>groups</span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold" style={{ color: 'var(--tx)' }}>
                            Disponibilidad · {nextMatchDay}
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color: availCount > 0 ? '#72e697' : 'var(--tx-3)' }}>
                            {availCount > 0 ? `${availCount} de ${totalActive} disponibles` : 'Sin respuestas aún'}
                          </p>
                        </div>
                      </Link>
                    )}

                    {yellowAlerts.slice(0, 2).map(alert => (
                      <Link key={alert.playerId} href={`/dashboard/season/${lastSeason!.id}/stats`}
                        className="flex items-start gap-2.5 rounded-[12px] border px-3.5 py-3 transition-all"
                        style={{ backgroundColor: 'rgba(251,191,36,0.04)', borderColor: 'rgba(251,191,36,0.18)' }}>
                        <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={{ color: '#fbbf24', fontSize: 16 }}>warning</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold truncate" style={{ color: '#fbbf24' }}>{alert.name} · {alert.count} amarillas</p>
                          <p className="text-[10px] mt-0.5" style={{ color: '#fde68a', opacity: 0.7 }}>A una sanción de baja</p>
                        </div>
                        <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 14, color: '#fbbf24', opacity: 0.5 }}>chevron_right</span>
                      </Link>
                    ))}

                    {topScorer && (
                      <div className="rounded-[12px] border px-3.5 py-3"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr)', boxShadow: 'var(--shadow-card)' }}>
                        <p className="text-[9px] font-extrabold uppercase tracking-widest mb-2" style={{ color: 'var(--tx-4)' }}>Máxima goleadora</p>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-black"
                            style={{ backgroundColor: 'rgba(114,230,151,0.15)', color: '#72e697', border: '1px solid rgba(114,230,151,0.25)' }}>
                            {topScorer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-bold truncate" style={{ color: 'var(--tx)' }}>{topScorer.name}</p>
                            {topScorer.position && <p className="text-[10px]" style={{ color: 'var(--tx-3)' }}>{topScorer.position}</p>}
                          </div>
                          <span className="text-[28px] font-black tabular-nums leading-none flex-shrink-0" style={{ color: '#facc15', fontFamily: 'Sora, sans-serif' }}>
                            {topScorer.goals}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Quick nav cards */}
                    <div className="grid grid-cols-1 gap-2 mt-1">
                      {nextSession
                        ? (
                          <Link href={`/dashboard/season/${lastSeason!.id}/trainings`}
                            className="flex items-center gap-3 rounded-[12px] border px-3.5 py-3 transition-all hover:border-[var(--bdr-strong)]"
                            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr)', boxShadow: 'var(--shadow-card)' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 18 }}>fitness_center</span>
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold" style={{ color: 'var(--tx)' }}>
                                {new Date(nextSession.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long' }).replace(/^\w/, c => c.toUpperCase())}
                              </p>
                              <p className="text-[10px]" style={{ color: 'var(--tx-4)' }}>
                                {nextSession.title ? nextSession.title : 'Próximo entreno'}
                              </p>
                            </div>
                          </Link>
                        ) : (
                          <Link href={lastSeason ? `/dashboard/season/${lastSeason.id}/trainings/new` : '#'}
                            className="flex items-center gap-3 rounded-[12px] border px-3.5 py-3 transition-all hover:border-[var(--bdr-strong)]"
                            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr)', boxShadow: 'var(--shadow-card)' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--tx-4)', fontSize: 18 }}>fitness_center</span>
                            <div>
                              <p className="text-[12px] font-semibold" style={{ color: 'var(--tx-2)' }}>Sin entrenos planificados</p>
                              <p className="text-[10px]" style={{ color: 'var(--tx-4)' }}>Añadir entrenamiento</p>
                            </div>
                          </Link>
                        )
                      }
                      <Link href={seasonHref}
                        className="flex items-center gap-3 rounded-[12px] border px-3.5 py-3 transition-all hover:border-[var(--bdr-strong)]"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr)', boxShadow: 'var(--shadow-card)' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 18 }}>calendar_today</span>
                        <div>
                          <p className="text-[12px] font-semibold" style={{ color: 'var(--tx)' }}>Temporada</p>
                          <p className="text-[10px]" style={{ color: 'var(--tx-4)' }}>{competitive.length > 0 ? `${competitive.length} partidos jugados` : 'Sin datos'}</p>
                        </div>
                      </Link>
                    </div>
                  </div>

                  </div>

                  {/* ── Alertas amarillas (móvil) ─────────────── */}
                  {yellowAlerts.length > 0 && (
                    <div className="lg:hidden space-y-2">
                      {yellowAlerts.slice(0, 2).map(alert => (
                        <Link key={alert.playerId} href={`/dashboard/season/${lastSeason!.id}/stats`}
                          className="flex items-center gap-2.5 rounded-[12px] border px-3.5 py-3 transition-all"
                          style={{ backgroundColor: 'rgba(251,191,36,0.04)', borderColor: 'rgba(251,191,36,0.18)' }}>
                          <span className="material-symbols-outlined flex-shrink-0" style={{ color: '#fbbf24', fontSize: 16 }}>warning</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold truncate" style={{ color: '#fbbf24' }}>{alert.name} · {alert.count} amarillas</p>
                            <p className="text-[10px]" style={{ color: '#fde68a', opacity: 0.7 }}>A una sanción de baja</p>
                          </div>
                          <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 14, color: '#fbbf24', opacity: 0.5 }}>chevron_right</span>
                        </Link>
                      ))}
                    </div>
                  )}

                </div>
              )
            })()}

            {/* ── MÚLTIPLES EQUIPOS ─────────────────────────── */}
            {teams.length > 1 && (
              <>
                <div className="mb-5 flex items-center justify-between">
                  <h1 className="text-[22px] font-bold tracking-[-0.03em]" style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>Tus equipos</h1>
                  <Link href="/dashboard/team/new"
                    className="flex items-center gap-1.5 rounded-[10px] px-4 text-sm font-bold transition-transform active:scale-95"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)', fontFamily: 'Sora, sans-serif', minHeight: 40 }}>
                    <span className="material-symbols-outlined text-sm">add</span>Nuevo
                  </Link>
                </div>
                <AnimatedList className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                  {teams.map((team, idx) => {
                    const { lastSeason, competitive, wins, draws, losses, points, recentForm, lastMatch, seasonHref } = processTeam(team)
                    const lastRes = lastMatch ? (lastMatch.goals_for > lastMatch.goals_against ? { l: 'V', c: 'var(--accent)' } : lastMatch.goals_for < lastMatch.goals_against ? { l: 'D', c: '#f87171' } : { l: 'E', c: '#fbbf24' }) : null
                    return (
                      <AnimatedItem key={team.id} delay={idx * 0.05}>
                        <div className="flex flex-col rounded-[14px] border p-5 transition-colors hover:border-[var(--bdr-strong)]"
                          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr)', boxShadow: 'var(--shadow-card)' }}>
                          <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)' }}>
                              <TeamLogo name={team.name} logoUrl={team.logo_url} size="md" className="h-9 w-9" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-[16px] font-semibold" style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>{team.name}</h3>
                              <p className="text-[11px]" style={{ color: 'var(--tx-3)' }}>{lastSeason?.name ?? 'Sin temporada'}</p>
                            </div>
                            {lastMatch && lastRes && (
                              <span className="flex-shrink-0 rounded px-2 py-0.5 text-[12px] font-bold" style={{ color: lastRes.c, backgroundColor: `${lastRes.c}14` }}>
                                {lastRes.l} {lastMatch.goals_for}-{lastMatch.goals_against}
                              </span>
                            )}
                          </div>
                          {competitive.length > 0 && (
                            <div className="mb-4 grid grid-cols-4 gap-2">
                              {[{ l: 'V', v: wins, c: 'var(--accent)' }, { l: 'E', v: draws, c: '#fbbf24' }, { l: 'D', v: losses, c: '#f87171' }, { l: 'Pts', v: points, c: 'var(--tx)' }].map(({ l, v, c }) => (
                                <div key={l} className="rounded-lg py-2 text-center" style={{ backgroundColor: 'var(--bg-base)' }}>
                                  <span className="block text-[18px] font-bold tabular-nums" style={{ color: c, fontFamily: 'Sora, sans-serif' }}>{v}</span>
                                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--bdr-strong)' }}>{l}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {recentForm.length > 0 && (
                            <div className="mb-4 flex gap-1.5">
                              {recentForm.map((m, i) => {
                                const res: 'V' | 'E' | 'D' = m.goals_for > m.goals_against ? 'V' : m.goals_for < m.goals_against ? 'D' : 'E'
                                return <span key={i} className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black" style={{ backgroundColor: res === 'V' ? 'var(--accent)' : res === 'E' ? 'var(--bg-elevated)' : '#2d1414', color: res === 'V' ? 'var(--accent-fg)' : res === 'E' ? 'var(--tx-2)' : '#f87171' }}>{res}</span>
                              })}
                            </div>
                          )}
                          <div className="mt-auto flex gap-2.5">
                            <Link href={`/dashboard/team/${team.id}/players`} className="flex flex-1 items-center justify-center rounded-lg border text-[13px] font-semibold transition-all active:scale-95" style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)', minHeight: 40 }}>Plantilla</Link>
                            <Link href={seasonHref} className="flex flex-1 items-center justify-center rounded-lg text-[13px] font-semibold transition-all active:scale-95" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)', fontFamily: 'Sora, sans-serif', minHeight: 40 }}>Temporada</Link>
                          </div>
                        </div>
                      </AnimatedItem>
                    )
                  })}
                  <AnimatedItem delay={teams.length * 0.05}>
                    <Link href="/dashboard/team/new" className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed text-center transition-all hover:border-[var(--accent)]" style={{ borderColor: 'var(--bdr-strong)' }}>
                      <span className="material-symbols-outlined text-[32px]" style={{ color: 'var(--bdr-strong)' }}>add_circle</span>
                      <p className="text-[14px] font-semibold" style={{ color: 'var(--tx-3)' }}>Añadir equipo</p>
                    </Link>
                  </AnimatedItem>
                </AnimatedList>
              </>
            )}
          </>
        )}
      </main>
    </PageTransition>
  )
}
