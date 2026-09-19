import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { AnimatedList, AnimatedItem } from '@/components/ui/animated-card'
import { PageTransition } from '@/components/ui/page-transition'
import { TeamLogo } from '@/components/team/team-logo'
import { OnboardingGuide } from '@/components/ui/onboarding-guide'
import { AlertsModal } from '@/components/ui/alerts-modal'

type Match = {
  id: string
  goals_for: number
  goals_against: number
  opponent: string
  played_at: string
  status?: string
  competition_type?: string
}

type Season = {
  id: string
  name: string
  created_at: string
  matches: Match[]
  training_sessions: { id: string; date: string; title: string | null }[]
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
    .select('*, seasons(id, name, created_at, matches(id, goals_for, goals_against, opponent, played_at, status, competition_type), training_sessions(id, date, title)), players(id, active)')
    .order('created_at', { ascending: true })

  const teams = (raw ?? []) as Team[]

  const recentSeasonIds = teams.flatMap(t => {
    if (!t.seasons.length) return []
    return [t.seasons.reduce((a, b) => a.created_at > b.created_at ? a : b).id]
  })

  let yellowAlerts: { playerId: string; name: string; count: number }[] = []
  if (recentSeasonIds.length > 0) {
    const { data: matchRows } = await supabase
      .from('matches')
      .select('appearances(player_id, yellow_cards, players(name, active))')
      .in('season_id', recentSeasonIds)
      .neq('status', 'scheduled')

    const playerMap = new Map<string, { name: string; count: number }>()
    for (const m of matchRows ?? []) {
      for (const a of (m as unknown as { appearances: { player_id: string; yellow_cards: number; players: { name: string; active: boolean } | null }[] }).appearances ?? []) {
        if (a.players?.active === false) continue
        const curr = playerMap.get(a.player_id) ?? { name: a.players?.name ?? '', count: 0 }
        curr.count += (a.yellow_cards ?? 0)
        playerMap.set(a.player_id, curr)
      }
    }
    yellowAlerts = [...playerMap.entries()]
      .map(([playerId, { name, count }]) => ({ playerId, name, count }))
      .filter(p => p.count >= 4)
      .sort((a, b) => b.count - a.count)
  }

  function processTeam(team: Team) {
    const lastSeason = [...team.seasons].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0] ?? null

    const allMatches = lastSeason?.matches ?? []
    const finished   = allMatches.filter(m => m.status !== 'scheduled')
    const competitive = finished.filter(m => (m.competition_type ?? 'liga') !== 'amistoso')
    const ligaOnly   = competitive.filter(m => (m.competition_type ?? 'liga') === 'liga')
    const sorted     = [...competitive].sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())
    const lastMatch  = [...finished].sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())[0] ?? null

    const wins    = competitive.filter(m => m.goals_for > m.goals_against).length
    const draws   = competitive.filter(m => m.goals_for === m.goals_against).length
    const losses  = competitive.filter(m => m.goals_for < m.goals_against).length
    const goalsFor    = competitive.reduce((s, m) => s + m.goals_for, 0)
    const goalsAgainst = competitive.reduce((s, m) => s + m.goals_against, 0)
    const points  = ligaOnly.filter(m => m.goals_for > m.goals_against).length * 3 +
                    ligaOnly.filter(m => m.goals_for === m.goals_against).length
    const playerCount = team.players.filter(p => p.active).length
    const recentForm  = sorted.slice(0, 5).reverse()

    let streakCount = 0
    let streakType: 'V' | 'D' | 'E' | null = null
    for (const m of sorted) {
      const r: 'V' | 'D' | 'E' = m.goals_for > m.goals_against ? 'V' : m.goals_for < m.goals_against ? 'D' : 'E'
      if (!streakType) { streakType = r; streakCount = 1 }
      else if (r === streakType) streakCount++
      else break
    }

    const nextMatch = allMatches.filter(m => m.status === 'scheduled').sort((a, b) => a.played_at.localeCompare(b.played_at))[0] ?? null
    const nextSession = [...(lastSeason?.training_sessions ?? [])].filter(s => s.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
    const seasonHref = team.seasons.length === 1 ? `/dashboard/season/${team.seasons[0].id}` : `/dashboard/team/${team.id}/seasons`

    return { lastSeason, allMatches, competitive, sorted, lastMatch, wins, draws, losses, goalsFor, goalsAgainst, points, playerCount, recentForm, streakCount, streakType, nextMatch, nextSession, seasonHref }
  }

  const firstTeam   = teams[0]
  const firstSeasons = firstTeam?.seasons ?? []
  const firstSeason = firstSeasons[0]

  return (
    <PageTransition>
      <AlertsModal alerts={yellowAlerts} />
      <main className="mx-auto w-full max-w-[620px] px-4 pt-6 pb-32 md:px-6 md:pt-10 md:pb-16">

        {/* ── EMPTY STATE ──────────────────────────────────────── */}
        {!teams.length && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[22px] border"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)' }}>
              <span className="material-symbols-outlined text-5xl" style={{ color: 'var(--accent)' }}>sports_soccer</span>
            </div>
            <div>
              <h1 className="text-[28px] font-bold tracking-[-0.035em]"
                style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>
                Empieza aquí
              </h1>
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

        {/* ── HAS TEAMS ────────────────────────────────────────── */}
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

            {/* ── SINGLE TEAM: full dashboard ─────────────────── */}
            {teams.length === 1 && (() => {
              const team = teams[0]
              const { lastSeason, competitive, lastMatch, wins, draws, losses, goalsFor, goalsAgainst, points, playerCount, recentForm, streakCount, streakType, nextMatch, nextSession, seasonHref } = processTeam(team)

              const streakColor = streakType === 'V' ? '#72e697' : streakType === 'D' ? '#f87171' : '#fbbf24'
              const streakLabel = streakCount >= 3 ? (
                streakType === 'V' ? `${streakCount}V seguidas` : streakType === 'D' ? `${streakCount}D seguidas` : `${streakCount}E seguidas`
              ) : null

              const heroInfo = nextMatch
                ? { type: 'next' as const, bg: 'rgba(251,191,36,0.05)', border: 'rgba(251,191,36,0.2)', color: '#fbbf24', label: '' }
                : lastMatch
                ? lastMatch.goals_for > lastMatch.goals_against
                  ? { type: 'result' as const, bg: 'rgba(114,230,151,0.05)', border: 'rgba(114,230,151,0.18)', color: '#72e697', label: 'Victoria' }
                  : lastMatch.goals_for < lastMatch.goals_against
                  ? { type: 'result' as const, bg: 'rgba(248,113,113,0.05)', border: 'rgba(248,113,113,0.18)', color: '#f87171', label: 'Derrota'  }
                  : { type: 'result' as const, bg: 'rgba(251,191,36,0.05)',  border: 'rgba(251,191,36,0.18)',  color: '#fbbf24', label: 'Empate'   }
                : null

              return (
                <div className="space-y-3">

                  {/* ── Team identity ─────────────────────────── */}
                  <div className="flex items-center gap-3">
                    <div className="h-[52px] w-[52px] flex-shrink-0 overflow-hidden rounded-[13px] border flex items-center justify-center"
                      style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)' }}>
                      <TeamLogo name={team.name} logoUrl={team.logo_url} size="lg" className="h-10 w-10" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="truncate text-[20px] font-extrabold leading-tight tracking-[-0.03em]"
                        style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>
                        {team.name}
                      </h1>
                      <p className="mt-0.5 text-[11px]" style={{ color: 'var(--tx-3)' }}>
                        {lastSeason?.name ?? 'Sin temporada activa'}
                        {(team.category ?? team.gender) ? ` · ${team.category ?? team.gender}` : ''}
                      </p>
                    </div>
                    {streakLabel && (
                      <span className="flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{ backgroundColor: `${streakColor}18`, color: streakColor, border: `1px solid ${streakColor}30` }}>
                        {streakLabel}
                      </span>
                    )}
                  </div>

                  {/* ── Hero: próximo partido ─────────────────── */}
                  {nextMatch && (
                    <Link href={`/dashboard/season/${lastSeason!.id}/match/${nextMatch.id}`}
                      className="block overflow-hidden rounded-[16px] border transition-all active:scale-[.99]"
                      style={{ backgroundColor: 'rgba(251,191,36,0.06)', borderColor: 'rgba(251,191,36,0.22)' }}>
                      <div className="flex items-stretch">
                        {/* Left: match info */}
                        <div className="flex-1 px-5 py-4">
                          <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[.12em]" style={{ color: '#fbbf24' }}>
                            Próximo partido
                          </p>
                          <p className="text-[22px] font-extrabold leading-tight tracking-[-0.02em]"
                            style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>
                            vs {nextMatch.opponent}
                          </p>
                          <p className="mt-1 text-[12px] capitalize" style={{ color: 'var(--tx-3)' }}>
                            {new Date(nextMatch.played_at + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                        </div>
                        {/* Right: date badge */}
                        <div className="flex flex-col items-center justify-center px-5 border-l" style={{ borderColor: 'rgba(251,191,36,0.15)', minWidth: 72 }}>
                          <span className="text-[32px] font-black leading-none tabular-nums"
                            style={{ color: '#fbbf24', fontFamily: 'Sora, sans-serif' }}>
                            {new Date(nextMatch.played_at + 'T12:00:00').getDate()}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: 'rgba(251,191,36,0.6)' }}>
                            {new Date(nextMatch.played_at + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short' })}
                          </span>
                        </div>
                      </div>
                      <div className="border-t flex items-center gap-1 px-5 py-2.5" style={{ borderColor: 'rgba(251,191,36,0.12)' }}>
                        <span className="text-[12px] font-semibold" style={{ color: '#fbbf24' }}>Abrir partido</span>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#fbbf24' }}>chevron_right</span>
                      </div>
                    </Link>
                  )}

                  {/* ── Hero: último resultado ────────────────── */}
                  {!nextMatch && lastMatch && heroInfo && heroInfo.type === 'result' && (
                    <Link href={`/dashboard/season/${lastSeason!.id}/match/${lastMatch.id}`}
                      className="block overflow-hidden rounded-[16px] border transition-all active:scale-[.99]"
                      style={{ backgroundColor: heroInfo.bg, borderColor: heroInfo.border }}>
                      <div className="px-5 pt-4 pb-3">
                        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[.12em]" style={{ color: heroInfo.color }}>
                          Último partido
                        </p>
                        <div className="flex items-center gap-4">
                          {/* Score */}
                          <div className="flex items-center gap-2 leading-none">
                            <span className="text-[52px] font-black tabular-nums"
                              style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif', lineHeight: 1 }}>
                              {lastMatch.goals_for}
                            </span>
                            <span className="text-[28px] font-black" style={{ color: 'var(--bdr-strong)' }}>–</span>
                            <span className="text-[52px] font-black tabular-nums"
                              style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif', lineHeight: 1 }}>
                              {lastMatch.goals_against}
                            </span>
                          </div>
                          {/* Result + rival */}
                          <div className="flex-1 min-w-0">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold mb-1"
                              style={{ backgroundColor: `${heroInfo.color}18`, color: heroInfo.color, border: `1px solid ${heroInfo.color}30` }}>
                              {heroInfo.label}
                            </span>
                            <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--tx-2)' }}>
                              vs {lastMatch.opponent}
                            </p>
                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--tx-3)' }}>
                              {new Date(lastMatch.played_at + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="border-t flex items-center gap-1 px-5 py-2.5" style={{ borderColor: `${heroInfo.color}14` }}>
                        <span className="text-[12px] font-semibold" style={{ color: heroInfo.color }}>Ver partido</span>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: heroInfo.color }}>chevron_right</span>
                      </div>
                    </Link>
                  )}

                  {/* No matches yet */}
                  {!nextMatch && !lastMatch && (
                    <Link href={seasonHref}
                      className="flex flex-col items-center justify-center gap-2.5 rounded-[16px] border border-dashed py-10 text-center transition-all"
                      style={{ borderColor: 'var(--bdr-strong)' }}>
                      <span className="material-symbols-outlined text-[32px]" style={{ color: 'var(--tx-4)' }}>sports_soccer</span>
                      <p className="text-[14px] font-semibold" style={{ color: 'var(--tx-3)' }}>Sin partidos registrados aún</p>
                      <p className="text-[12px] px-6 leading-5" style={{ color: 'var(--tx-4)' }}>
                        Añade el primer partido de la temporada
                      </p>
                    </Link>
                  )}

                  {/* ── Stats: 7 columnas ────────────────────── */}
                  {competitive.length > 0 && (
                    <div className="overflow-hidden rounded-[14px] border" style={{ backgroundColor: 'var(--bg-card-2)', borderColor: 'var(--bdr)' }}>
                      <div className="grid grid-cols-7">
                        {[
                          { label: 'PJ',  value: competitive.length, color: 'var(--tx)' },
                          { label: 'V',   value: wins,               color: '#72e697' },
                          { label: 'E',   value: draws,              color: '#fbbf24' },
                          { label: 'D',   value: losses,             color: '#f87171' },
                          { label: 'GF',  value: goalsFor,           color: '#72e697' },
                          { label: 'GC',  value: goalsAgainst,       color: '#f87171' },
                          { label: 'Pts', value: points,             color: 'var(--tx)' },
                        ].map(({ label, value, color }, i) => (
                          <div key={label} className="flex flex-col items-center gap-0.5 py-3.5"
                            style={{ borderLeft: i > 0 ? '1px solid var(--bdr)' : undefined }}>
                            <span className="text-[20px] font-extrabold tabular-nums leading-none"
                              style={{ color, fontFamily: 'Sora, sans-serif' }}>{value}</span>
                            <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--tx-4)' }}>{label}</span>
                          </div>
                        ))}
                      </div>
                      {(wins + draws + losses) > 0 && (
                        <div className="flex h-[3px]">
                          {wins   > 0 && <div style={{ flex: wins,   backgroundColor: '#72e697' }} />}
                          {draws  > 0 && <div style={{ flex: draws,  backgroundColor: '#fbbf24', opacity: 0.8 }} />}
                          {losses > 0 && <div style={{ flex: losses, backgroundColor: '#f87171', opacity: 0.7 }} />}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Forma + GF/GC ────────────────────────── */}
                  {recentForm.length > 0 && (
                    <div className="flex items-center justify-between px-1">
                      <div>
                        <p className="mb-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-3)' }}>Forma reciente</p>
                        <div className="flex gap-1.5">
                          {recentForm.map((m, i) => {
                            const res: 'V' | 'E' | 'D' = m.goals_for > m.goals_against ? 'V' : m.goals_for < m.goals_against ? 'D' : 'E'
                            const s = {
                              V: { bg: '#72e697',                   text: '#07140c' },
                              E: { bg: 'var(--bg-elevated)',        text: 'var(--tx-2)' },
                              D: { bg: 'rgba(248,113,113,0.18)',    text: '#f87171' },
                            }[res]
                            return (
                              <span key={i} className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black"
                                style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.bg}40` }}>
                                {res}
                              </span>
                            )
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

                  {/* ── Próximo entrenamiento ─────────────────── */}
                  {nextSession && (
                    <Link href={`/dashboard/season/${lastSeason!.id}/trainings`}
                      className="flex items-center gap-3 rounded-[12px] border px-4 py-3 transition-all active:scale-[.99]"
                      style={{ backgroundColor: 'rgba(114,230,151,0.04)', borderColor: 'rgba(114,230,151,0.14)' }}>
                      <span className="material-symbols-outlined flex-shrink-0" style={{ color: 'var(--accent)', fontSize: 18 }}>fitness_center</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Próximo entrenamiento</p>
                        <p className="mt-0.5 truncate text-[12px] capitalize" style={{ color: 'var(--tx-2)' }}>
                          {new Date(nextSession.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                          {nextSession.title ? ` · ${nextSession.title}` : ''}
                        </p>
                      </div>
                      <span className="material-symbols-outlined opacity-30 flex-shrink-0" style={{ fontSize: 16, color: 'var(--accent)' }}>chevron_right</span>
                    </Link>
                  )}

                  {/* ── Quick tiles ──────────────────────────── */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <Link href={`/dashboard/team/${team.id}/players`}
                      className="flex flex-col gap-1.5 rounded-[14px] border p-4 transition-all active:scale-[.97] hover:border-[var(--accent)]/30"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr)' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-subtle)' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 18 }}>group</span>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>Plantilla</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--tx-4)' }}>
                          {playerCount > 0 ? `${playerCount} jug.` : '—'}
                        </p>
                      </div>
                    </Link>
                    <Link href={seasonHref}
                      className="flex flex-col gap-1.5 rounded-[14px] border p-4 transition-all active:scale-[.97] hover:border-[var(--accent)]/30"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr)' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-subtle)' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 18 }}>calendar_today</span>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>Partidos</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--tx-4)' }}>
                          {competitive.length > 0 ? `${competitive.length} jugados` : 'Sin datos'}
                        </p>
                      </div>
                    </Link>
                    <Link href={`/dashboard/season/${lastSeason?.id ?? ''}/stats`}
                      className="flex flex-col gap-1.5 rounded-[14px] border p-4 transition-all active:scale-[.97] hover:border-[var(--accent)]/30"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr)' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-subtle)' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 18 }}>bar_chart</span>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>Estadísticas</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--tx-4)' }}>Rankings</p>
                      </div>
                    </Link>
                  </div>

                </div>
              )
            })()}

            {/* ── MULTIPLE TEAMS: grid ─────────────────────────── */}
            {teams.length > 1 && (
              <>
                <div className="mb-5 flex items-center justify-between">
                  <h1 className="text-[22px] font-bold tracking-[-0.03em]"
                    style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>
                    Tus equipos
                  </h1>
                  <Link href="/dashboard/team/new"
                    className="flex items-center gap-1.5 rounded-[10px] px-4 text-sm font-bold transition-transform active:scale-95"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)', fontFamily: 'Sora, sans-serif', minHeight: 40 }}>
                    <span className="material-symbols-outlined text-sm">add</span>
                    Nuevo
                  </Link>
                </div>

                <AnimatedList className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                  {teams.map((team, idx) => {
                    const { lastSeason, competitive, wins, draws, losses, points, recentForm, lastMatch, seasonHref } = processTeam(team)

                    const lastResultInfo = lastMatch
                      ? lastMatch.goals_for > lastMatch.goals_against ? { label: 'V', color: 'var(--accent)' }
                        : lastMatch.goals_for < lastMatch.goals_against ? { label: 'D', color: '#f87171' }
                        : { label: 'E', color: '#fbbf24' }
                      : null

                    return (
                      <AnimatedItem key={team.id} delay={idx * 0.05}>
                        <div className="flex flex-col rounded-[14px] border p-5 transition-colors hover:border-[var(--bdr-strong)]"
                          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr)' }}>
                          <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border"
                              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)' }}>
                              <TeamLogo name={team.name} logoUrl={team.logo_url} size="md" className="h-9 w-9" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-[16px] font-semibold"
                                style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>{team.name}</h3>
                              <p className="text-[11px]" style={{ color: 'var(--tx-3)' }}>{lastSeason?.name ?? 'Sin temporada'}</p>
                            </div>
                            {lastMatch && lastResultInfo && (
                              <span className="flex-shrink-0 rounded px-2 py-0.5 text-[12px] font-bold"
                                style={{ color: lastResultInfo.color, backgroundColor: `${lastResultInfo.color}14` }}>
                                {lastResultInfo.label} {lastMatch.goals_for}-{lastMatch.goals_against}
                              </span>
                            )}
                          </div>

                          {competitive.length > 0 && (
                            <div className="mb-4 grid grid-cols-4 gap-2">
                              {[
                                { label: 'V',   value: wins,   color: 'var(--accent)' },
                                { label: 'E',   value: draws,  color: '#fbbf24' },
                                { label: 'D',   value: losses, color: '#f87171' },
                                { label: 'Pts', value: points, color: 'var(--tx)' },
                              ].map(({ label, value, color }) => (
                                <div key={label} className="rounded-lg py-2 text-center" style={{ backgroundColor: 'var(--bg-base)' }}>
                                  <span className="block text-[18px] font-bold tabular-nums"
                                    style={{ color, fontFamily: 'Sora, sans-serif' }}>{value}</span>
                                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--bdr-strong)' }}>{label}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {recentForm.length > 0 && (
                            <div className="mb-4 flex gap-1.5">
                              {recentForm.map((m, i) => {
                                const res: 'V' | 'E' | 'D' = m.goals_for > m.goals_against ? 'V' : m.goals_for < m.goals_against ? 'D' : 'E'
                                return (
                                  <span key={i} className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black"
                                    style={{
                                      backgroundColor: res === 'V' ? 'var(--accent)' : res === 'E' ? 'var(--bg-elevated)' : '#2d1414',
                                      color: res === 'V' ? 'var(--accent-fg)' : res === 'E' ? 'var(--tx-2)' : '#f87171',
                                    }}>
                                    {res}
                                  </span>
                                )
                              })}
                            </div>
                          )}

                          <div className="mt-auto flex gap-2.5">
                            <Link href={`/dashboard/team/${team.id}/players`}
                              className="flex flex-1 items-center justify-center rounded-lg border text-[13px] font-semibold transition-all active:scale-95"
                              style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)', minHeight: 40 }}>
                              Plantilla
                            </Link>
                            <Link href={seasonHref}
                              className="flex flex-1 items-center justify-center rounded-lg text-[13px] font-semibold transition-all active:scale-95"
                              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)', fontFamily: 'Sora, sans-serif', minHeight: 40 }}>
                              Temporada
                            </Link>
                          </div>
                        </div>
                      </AnimatedItem>
                    )
                  })}

                  <AnimatedItem delay={teams.length * 0.05}>
                    <Link href="/dashboard/team/new"
                      className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed text-center transition-all hover:border-[var(--accent)]"
                      style={{ borderColor: 'var(--bdr-strong)' }}>
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
