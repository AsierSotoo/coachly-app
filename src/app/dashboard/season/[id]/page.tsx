import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createMatch, updateSeasonLeague } from '../actions'
import Link from 'next/link'
import { DeleteMatchButton } from '@/components/match/delete-match-button'
import { PageTransition } from '@/components/ui/page-transition'
import { TeamLogo } from '@/components/team/team-logo'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('seasons').select('name, teams(name)').eq('id', id).single()
  if (!data) return { title: 'Temporada' }
  const team = Array.isArray(data.teams) ? data.teams[0] : data.teams as { name: string } | null
  return { title: `${data.name}${team ? ` · ${team.name}` : ''}` }
}

function dateStr(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function OpponentInitial({ name }: { name: string }) {
  const letters = name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div className="w-10 h-10 rounded flex items-center justify-center text-[11px] font-black border flex-shrink-0"
      style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)' }}>
      {letters}
    </div>
  )
}

export default async function SeasonPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; new?: string; q?: string; r?: string; ct?: string }>
}) {
  const { id: seasonId } = await params
  const supabase = await createClient()

  const [{ data: season }, { data: matchesRaw }] = await Promise.all([
    supabase.from('seasons').select('*, teams(*)').eq('id', seasonId).single(),
    supabase.from('matches')
      .select('*, convocatorias(id), appearances(id, goals, player_id, players(name))')
      .eq('season_id', seasonId)
      .order('played_at', { ascending: false }),
  ])
  if (!season) notFound()

  const sp = await searchParams
  const team = season.teams as { id: string; name: string; logo_url?: string | null }

  const allMatches = matchesRaw ?? []
  type MatchWithStatus = (typeof allMatches)[0] & { status?: string }
  // Separar programados (no jugados) de finalizados
  const scheduledMatches = (allMatches as MatchWithStatus[])
    .filter(m => m.status === 'scheduled')
    .sort((a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime())

  // Fetch availability counts for scheduled matches
  const availabilityByMatch = new Map<string, { available: number; doubt: number; unavailable: number }>()
  if (scheduledMatches.length > 0) {
    const scheduledIds = scheduledMatches.map(m => m.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: availRows } = await (supabase.from('match_availability') as any)
      .select('match_id, status')
      .in('match_id', scheduledIds)
    for (const row of (availRows as { match_id: string; status: string }[]) ?? []) {
      const prev = availabilityByMatch.get(row.match_id) ?? { available: 0, doubt: 0, unavailable: 0 }
      if (row.status === 'available') prev.available++
      else if (row.status === 'doubt') prev.doubt++
      else if (row.status === 'unavailable') prev.unavailable++
      availabilityByMatch.set(row.match_id, prev)
    }
  }
  type MatchWithType = MatchWithStatus & { competition_type?: string | null }
  const matches = (allMatches as MatchWithType[]).filter(m => m.status !== 'scheduled')

  // Liga/Copa = competitivos (cuentan V/E/D). Solo liga cuenta puntos. Amistosos no cuentan en stats.
  const competitiveMatches = matches.filter(m => (m.competition_type ?? 'liga') !== 'amistoso')
  const ligaMatches        = competitiveMatches.filter(m => (m.competition_type ?? 'liga') === 'liga')

  const searchQ = sp.q?.toLowerCase() ?? ''
  const resultFilter = sp.r ?? ''
  const ctFilter = sp.ct ?? ''

  const preCtFiltered = matches
    .filter(m => !searchQ || m.opponent.toLowerCase().includes(searchQ))
    .filter(m => {
      if (!resultFilter || resultFilter === 'all') return true
      const r = m.goals_for > m.goals_against ? 'V' : m.goals_for < m.goals_against ? 'D' : 'E'
      return r === resultFilter
    })

  const ligaCountF      = preCtFiltered.filter(m => (m.competition_type ?? 'liga') === 'liga').length
  const copaCountF      = preCtFiltered.filter(m => (m.competition_type ?? 'liga') === 'copa').length
  const amistosaCountF  = preCtFiltered.filter(m => (m.competition_type ?? 'liga') === 'amistoso').length
  const hasMultipleCTs  = (ligaCountF > 0 ? 1 : 0) + (copaCountF > 0 ? 1 : 0) + (amistosaCountF > 0 ? 1 : 0) > 1

  const filtered = preCtFiltered.filter(m => {
    if (!ctFilter) return true
    return (m.competition_type ?? 'liga') === ctFilter
  })

  const wins   = competitiveMatches.filter(m => m.goals_for > m.goals_against).length
  const draws  = competitiveMatches.filter(m => m.goals_for === m.goals_against).length
  const losses = competitiveMatches.filter(m => m.goals_for < m.goals_against).length
  const total  = competitiveMatches.length

  const winRate   = total > 0 ? Math.round((wins   / total) * 100) : 0
  const drawRate  = total > 0 ? Math.round((draws  / total) * 100) : 0
  const lossRate  = total > 0 ? Math.round((losses / total) * 100) : 0
  const ligaPts   = ligaMatches.filter(m => m.goals_for > m.goals_against).length * 3 +
                    ligaMatches.filter(m => m.goals_for === m.goals_against).length
  const goalsFor  = matches.reduce((s, m) => s + (m.goals_for ?? 0), 0)
  const goalsAgainst = matches.reduce((s, m) => s + (m.goals_against ?? 0), 0)

  const showForm = sp.new === '1' || !!sp.error || (total === 0 && scheduledMatches.length === 0)
  const opponents = [...new Set(allMatches.map(m => m.opponent))].sort()

  type AppRow = { id: string; goals: number | null; player_id: string; players: { name: string } | null }
  const pendingData = matches.filter(m => (m.appearances as AppRow[]).length === 0).length

  // Top goleadoras — todos los partidos (amistosos incluidos, los goles son los goles)
  const scorerMap = new Map<string, { name: string; goals: number }>()
  for (const m of matches) {
    for (const app of (m.appearances as AppRow[])) {
      if ((app.goals ?? 0) > 0 && app.players?.name) {
        const cur = scorerMap.get(app.player_id) ?? { name: app.players.name, goals: 0 }
        cur.goals += app.goals ?? 0
        scorerMap.set(app.player_id, cur)
      }
    }
  }
  const topScorers = [...scorerMap.values()].sort((a, b) => b.goals - a.goals).slice(0, 3)

  // Forma reciente: solo partidos competitivos (liga + copa), sin amistosos
  const sortedCompetitive = [...competitiveMatches].sort((a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime())
  const recentForm = sortedCompetitive.slice(-5).map(m => m.goals_for > m.goals_against ? 'V' : m.goals_for < m.goals_against ? 'D' : 'E')

  // Racha actual — solo competitivos
  const byDateDesc = [...sortedCompetitive].reverse()
  let streakCount = 0
  let streakType: 'V' | 'D' | 'E' | null = null
  for (const m of byDateDesc) {
    const r = m.goals_for > m.goals_against ? 'V' : m.goals_for < m.goals_against ? 'D' : ('E' as 'V' | 'D' | 'E')
    if (streakType === null) { streakType = r; streakCount = 1 }
    else if (r === streakType) streakCount++
    else break
  }
  const streakLabel = streakCount >= 2 ? (
    streakType === 'V' ? `${streakCount} victorias seguidas` :
    streakType === 'D' ? `${streakCount} derrotas seguidas` :
    `${streakCount} empates seguidos`
  ) : null
  const streakColor = streakType === 'V' ? 'var(--accent)' : streakType === 'D' ? '#f87171' : '#fbbf24'

  return (
    <PageTransition>
      <main className="max-w-7xl mx-auto px-4 md:px-10 py-6 md:py-8 pb-32 md:pb-10">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-7">
          <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)' }}>
            <TeamLogo name={team.name} logoUrl={team.logo_url} size="lg" className="w-full h-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold mb-0.5 truncate" style={{ color: 'var(--tx-3)' }}>
              {(season as unknown as { name: string }).name}
            </p>
            <h1 className="text-[20px] md:text-[22px] font-black leading-tight truncate" style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>
              {team.name}
            </h1>
          </div>
          {total > 0 && (
            <div className="flex items-center rounded-xl border overflow-hidden flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}>
              <div className="px-2.5 py-2 sm:px-4 sm:py-2.5 text-center border-r" style={{ borderColor: 'var(--bdr)' }}>
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-3)' }}>PJ</p>
                <p className="text-[15px] sm:text-[18px] font-black tabular-nums leading-tight" style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>{total}</p>
              </div>
              <div className="px-2.5 py-2 sm:px-4 sm:py-2.5 text-center border-r" style={{ borderColor: 'var(--bdr)' }}>
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-3)' }}>GF</p>
                <p className="text-[15px] sm:text-[18px] font-black tabular-nums leading-tight" style={{ color: 'var(--accent)', fontFamily: 'Sora, sans-serif' }}>{goalsFor}</p>
              </div>
              <div className="px-2.5 py-2 sm:px-4 sm:py-2.5 text-center border-r" style={{ borderColor: 'var(--bdr)' }}>
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-3)' }}>GC</p>
                <p className="text-[15px] sm:text-[18px] font-black tabular-nums leading-tight" style={{ color: 'var(--c-danger)', fontFamily: 'Sora, sans-serif' }}>{goalsAgainst}</p>
              </div>
              {ligaMatches.length > 0 && (
                <div className="px-2.5 py-2 sm:px-4 sm:py-2.5 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-3)' }}>PTS</p>
                  <p className="text-[15px] sm:text-[18px] font-black tabular-nums leading-tight" style={{ color: 'var(--accent)', fontFamily: 'Sora, sans-serif' }}>{ligaPts}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Balance competitivo ─────────────────────────────────────── */}
        <section className="mb-6 overflow-hidden rounded-[14px] border md:mb-8"
          style={{ borderColor: 'var(--bdr-strong)', backgroundColor: 'var(--bg-card)' }}>
          <div className="flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            style={{ borderColor: 'var(--bdr-strong)' }}>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em]" style={{ color: 'var(--accent)' }}>Balance competitivo</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--tx-2)' }}>{total > 0 ? `${winRate}% de victorias en ${total} partidos` : 'Todavía no hay partidos finalizados'}</p>
            </div>
            <div className="flex items-center gap-5 sm:gap-7">
              <div><span className="text-2xl font-extrabold tabular-nums" style={{ color: 'var(--tx)' }}>{wins}</span><span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-3)' }}>V</span></div>
              <div><span className="text-2xl font-extrabold tabular-nums" style={{ color: 'var(--tx)' }}>{draws}</span><span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-3)' }}>E</span></div>
              <div><span className="text-2xl font-extrabold tabular-nums" style={{ color: 'var(--tx)' }}>{losses}</span><span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-3)' }}>D</span></div>
            </div>
          </div>
          {total > 0 && (
            <div className="flex h-1.5" style={{ backgroundColor: 'var(--bg)' }}>
              {wins > 0 && <div style={{ width: `${winRate}%`, backgroundColor: 'var(--accent)' }} />}
              {draws > 0 && <div style={{ width: `${drawRate}%`, backgroundColor: 'var(--tx-3)' }} />}
              {losses > 0 && <div style={{ width: `${lossRate}%`, backgroundColor: 'var(--c-danger)' }} />}
            </div>
          )}
        </section>

        {/* ── Forma reciente ──────────────────────────────────────────── */}
        {recentForm.length > 0 && (
          <div className="flex items-center gap-3 mb-6 px-1">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--tx-2)' }}>Forma</span>
            <div className="flex gap-1.5">
              {recentForm.map((r, i) => (
                <div key={i}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black border"
                  style={{
                    backgroundColor: r === 'V' ? 'rgba(var(--accent-rgb),0.1)' : r === 'D' ? 'var(--c-danger-bg)' : 'var(--c-warn-bg)',
                    borderColor:     r === 'V' ? 'rgba(var(--accent-rgb),0.3)' : r === 'D' ? 'var(--c-danger-bdr)' : 'var(--c-warn-bdr)',
                    color:           r === 'V' ? 'var(--accent)' : r === 'D' ? 'var(--c-danger)' : 'var(--c-warn)',
                  }}>
                  {r}
                </div>
              ))}
            </div>
            <span className="text-[11px]" style={{ color: 'var(--tx-2)' }}>
              {wins}V {draws}E {losses}D · {total} PJ
            </span>
            {streakLabel && (
              <span className="ml-auto flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                style={{ color: streakColor, borderColor: `${streakColor}33`, backgroundColor: `${streakColor}10` }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                  {streakType === 'V' ? 'local_fire_department' : streakType === 'D' ? 'trending_down' : 'drag_handle'}
                </span>
                {streakLabel}
              </span>
            )}
          </div>
        )}

        {/* ── Posición en liga ────────────────────────────────────────── */}
        {(() => {
          const lp = (season as unknown as { league_position?: number | null }).league_position
          const lt = (season as unknown as { league_total_teams?: number | null }).league_total_teams
          const ordinal = (n: number) => n === 1 ? '1ª' : n === 2 ? '2ª' : n === 3 ? '3ª' : `${n}ª`
          return (
            <div className="flex flex-wrap items-center gap-2 mb-5 px-1">
              <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: 'var(--tx-2)' }}>Liga</span>
              {lp != null && lt != null ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold"
                  style={{ backgroundColor: 'var(--accent-subtle)', borderColor: 'var(--bdr)', color: 'var(--accent)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>leaderboard</span>
                  {ordinal(lp)} de {lt}
                </span>
              ) : (
                <span className="text-[11px]" style={{ color: 'var(--tx-3)' }}>Sin datos</span>
              )}
              <form action={updateSeasonLeague} className="flex items-center gap-1.5 ml-auto">
                <input type="hidden" name="season_id" value={seasonId} />
                <input name="league_position" type="number" min="1" defaultValue={lp ?? ''} placeholder="Pos"
                  className="w-14 h-8 rounded-lg border px-1 text-sm text-center outline-none transition-colors"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bdr-strong)', color: 'var(--tx)' }} />
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--tx-3)' }}>/</span>
                <input name="league_total_teams" type="number" min="2" defaultValue={lt ?? ''} placeholder="Tot"
                  className="w-14 h-8 rounded-lg border px-1 text-sm text-center outline-none transition-colors"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bdr-strong)', color: 'var(--tx)' }} />
                <button type="submit"
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border transition-colors active:scale-95"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                </button>
              </form>
            </div>
          )
        })()}

        {/* ── Mini leaderboard ─────────────────────────────────────────── */}
        {topScorers.length > 0 && (
          <div className="flex items-center gap-2 mb-5 px-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: 'var(--tx-2)' }}>Goleadoras</span>
            {topScorers.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px]"
                style={{
                  backgroundColor: i === 0 ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                  borderColor: i === 0 ? 'var(--bdr)' : 'var(--bdr-strong)',
                  color: i === 0 ? 'var(--accent)' : 'var(--tx-2)',
                }}>
                <span className="font-black text-[9px]" style={{ color: i === 0 ? 'var(--c-goals)' : i === 1 ? 'var(--tx-3)' : 'var(--c-warn-sub)' }}>
                  {i + 1}
                </span>
                <span className="font-semibold">{s.name.split(' ')[0]}</span>
                <span className="font-black">{s.goals}</span>
              </div>
            ))}
            <Link href={`/dashboard/season/${seasonId}/stats`} className="text-[10px] font-bold ml-auto flex-shrink-0"
              style={{ color: 'var(--accent)' }}>
              Ver stats →
            </Link>
          </div>
        )}

        {/* ── Barra de acciones ────────────────────────────────────────── */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3">
            <Link
              href={`/dashboard/season/${seasonId}?new=1`}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm active:scale-95 transition-all col-span-2 md:col-span-1"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)', fontFamily: 'Sora, sans-serif' }}
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Nuevo Partido
            </Link>
            <Link
              href={`/dashboard/team/${team.id}/players`}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm border active:scale-95 transition-all"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)', color: 'var(--tx)' }}
            >
              <span className="material-symbols-outlined text-lg">person_pin</span>
              <span>Plantilla</span>
            </Link>
            <Link
              href={`/dashboard/season/${seasonId}/trainings`}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm border active:scale-95 transition-all"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)', color: 'var(--tx)' }}
            >
              <span className="material-symbols-outlined text-lg">fitness_center</span>
              <span>Entrenos</span>
            </Link>
            <Link
              href={`/dashboard/season/${seasonId}/convocatorias`}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm border active:scale-95 transition-all"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)', color: 'var(--tx)' }}
            >
              <span className="material-symbols-outlined text-lg">groups</span>
              <span>Convocatorias</span>
            </Link>
            <Link
              href={`/dashboard/season/${seasonId}/calendar`}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm border active:scale-95 transition-all"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)', color: 'var(--tx)' }}
            >
              <span className="material-symbols-outlined text-lg">calendar_month</span>
              <span>Calendario</span>
            </Link>
          </div>

          {/* Filtros */}
          <div className="flex flex-col gap-2">
            {/* Chips resultado */}
            {total > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {([
                  { label: 'Todos', r: '', count: total },
                  { label: `V ${wins}`, r: 'V', count: wins },
                  { label: `E ${draws}`, r: 'E', count: draws },
                  { label: `D ${losses}`, r: 'D', count: losses },
                ] as { label: string; r: string; count: number }[]).filter(c => c.r === '' || c.count > 0).map(({ label, r }) => {
                  const active = resultFilter === r || (!resultFilter && r === '')
                  const color = r === 'V' ? 'var(--accent)' : r === 'D' ? '#f87171' : r === 'E' ? '#fbbf24' : 'var(--tx)'
                  const ctPart = ctFilter ? `&ct=${ctFilter}` : ''
                  const qPart = sp.q ? `&q=${sp.q}` : ''
                  return (
                    <a key={r}
                      href={`/dashboard/season/${seasonId}?${r ? `r=${r}` : ''}${ctPart}${qPart}`}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all"
                      style={{
                        backgroundColor: active ? `${color}18` : 'transparent',
                        borderColor: active ? `${color}50` : 'var(--bdr-strong)',
                        color: active ? color : 'var(--tx-2)',
                      }}>
                      {label}
                    </a>
                  )
                })}
              </div>
            )}
            {/* Chips tipo de competición — solo si hay mezcla */}
            {hasMultipleCTs && (
              <div className="flex items-center gap-1 flex-wrap">
                {([
                  { label: 'Todos', ct: '', count: preCtFiltered.length },
                  { label: 'Liga', ct: 'liga', count: ligaCountF },
                  { label: 'Copa', ct: 'copa', count: copaCountF },
                  { label: 'Amistoso', ct: 'amistoso', count: amistosaCountF },
                ] as { label: string; ct: string; count: number }[]).filter(c => c.ct === '' || c.count > 0).map(({ label, ct, count }) => {
                  const active = ctFilter === ct || (!ctFilter && ct === '')
                  const color = '#a78bfa'
                  const rPart = resultFilter ? `r=${resultFilter}&` : ''
                  const qPart = sp.q ? `&q=${sp.q}` : ''
                  return (
                    <a key={ct}
                      href={`/dashboard/season/${seasonId}?${rPart}${ct ? `ct=${ct}` : ''}${qPart}`}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all"
                      style={{
                        backgroundColor: active ? `${color}15` : 'transparent',
                        borderColor: active ? `${color}40` : 'var(--bdr-strong)',
                        color: active ? color : 'var(--tx-3)',
                      }}>
                      {label}{ct && count > 0 ? ` ${count}` : ''}
                    </a>
                  )
                })}
              </div>
            )}
            {/* Buscador */}
            <form method="get" action={`/dashboard/season/${seasonId}`}
              className="flex items-center gap-2 rounded-lg border px-4 py-2.5 transition-colors"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bdr-strong)' }}>
              {resultFilter && <input type="hidden" name="r" value={resultFilter} />}
              {ctFilter && <input type="hidden" name="ct" value={ctFilter} />}
              <span className="material-symbols-outlined" style={{ color: 'var(--tx-3)', fontSize: 18 }}>search</span>
              <input
                name="q"
                type="text"
                placeholder="Buscar rival..."
                defaultValue={sp.q ?? ''}
                className="bg-transparent border-none outline-none text-sm w-36"
                style={{ color: 'var(--tx)' }}
              />
            </form>
          </div>
        </section>

        {/* ── Formulario Nuevo Partido ─────────────────────────────────── */}
        {showForm && (
          <section
            className="mb-8 rounded-2xl border overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}
          >
            <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: 'var(--bdr-strong)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--accent)' }}>calendar_month</span>
              <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--tx-2)' }}>Añadir al calendario</h3>
            </div>
            <p className="px-6 pt-4 text-xs" style={{ color: 'var(--tx-3)' }}>
              El partido quedará programado. Cuando acabe, entra en él y pulsa <strong style={{ color: 'var(--tx-2)' }}>Finalizar partido</strong> para registrar el resultado.
            </p>
            <form action={createMatch} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="hidden" name="season_id" value={seasonId} />
              {opponents.length > 0 && (
                <datalist id="opponents-list">
                  {opponents.map(o => <option key={o} value={o} />)}
                </datalist>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-2)' }}>Rival</label>
                <input name="opponent" type="text" required placeholder="Nombre del rival" list="opponents-list"
                  className="border rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bdr-strong)', color: 'var(--tx)' }} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-2)' }}>Fecha y hora</label>
                <div className="flex gap-2">
                  <input name="played_at" type="date" required defaultValue={new Date().toISOString().split('T')[0]}
                    className="flex-1 border rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bdr-strong)', color: 'var(--tx)' }} />
                  <input name="match_time" type="time"
                    className="w-28 border rounded-xl px-3 py-3 text-sm outline-none transition-all"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bdr-strong)', color: 'var(--tx)' }}
                    title="Hora del partido (opcional)" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-2)' }}>Campo</label>
                <select name="home"
                  className="border rounded-xl px-4 py-3 text-sm outline-none transition-all appearance-none"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bdr-strong)', color: 'var(--tx)' }}>
                  <option value="true">Local</option>
                  <option value="false">Visitante</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-2)' }}>Tipo</label>
                <select name="competition_type"
                  className="border rounded-xl px-4 py-3 text-sm outline-none transition-all appearance-none"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bdr-strong)', color: 'var(--tx)' }}>
                  <option value="liga">Liga</option>
                  <option value="copa">Copa</option>
                  <option value="amistoso">Amistoso</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-2)' }}>Nombre competición</label>
                <input name="competition" type="text" placeholder="Liga Navarra, Copa..."
                  className="border rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bdr-strong)', color: 'var(--tx)' }} />
              </div>

              <div className="md:col-span-2 flex items-end">
                <button type="submit"
                  className="w-full h-[50px] rounded-xl flex items-center justify-center gap-2 text-sm font-bold active:scale-95 transition-transform cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}>
                  <span className="material-symbols-outlined text-lg">add</span>
                  Añadir partido
                </button>
              </div>
            </form>
            {sp.error && (
              <p className="mx-6 mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm" style={{ color: '#ffb4ab' }}>
                {sp.error}
              </p>
            )}
          </section>
        )}

        {/* ── Próximos partidos (programados) ─────────────────────────── */}
        {scheduledMatches.length > 0 && (
          <section className="mb-6 rounded-2xl border overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}>
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)' }}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={{ color: 'var(--tx-2)', fontSize: 18 }}>calendar_month</span>
                <h3 className="text-base font-semibold" style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>
                  Calendario · {scheduledMatches.length} partido{scheduledMatches.length !== 1 ? 's' : ''}
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded"
                style={{ backgroundColor: 'var(--bg-card)', color: 'var(--tx-2)', border: '1px solid var(--bdr)' }}>
                Programados
              </span>
            </div>
            <div>
              {scheduledMatches.map(m => (
                <div key={m.id} className="flex items-center gap-3 px-4 md:px-6 py-3 border-b last:border-0 transition-colors group"
                  style={{ borderColor: 'var(--bdr)' }}>
                  {/* Fecha */}
                  <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--bdr-strong)' }}>
                    <span className="text-[9px] font-bold uppercase leading-none" style={{ color: 'var(--tx-3)' }}>
                      {new Date(m.played_at + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short' })}
                    </span>
                    <span className="text-[18px] font-black leading-tight" style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>
                      {new Date(m.played_at + 'T12:00:00').getDate()}
                    </span>
                  </div>
                  {/* Info rival */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--tx)' }}>{m.opponent}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ backgroundColor: m.home ? 'var(--accent-subtle)' : 'var(--bg-elevated)', color: m.home ? 'var(--accent)' : 'var(--tx-2)' }}>
                        {m.home ? 'Local' : 'Visit.'}
                      </span>
                      {(m as { match_time?: string | null }).match_time && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                          {(m as { match_time?: string | null }).match_time!.slice(0, 5)}h
                        </span>
                      )}
                    </div>
                    {m.competition && (
                      <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--tx-3)' }}>{m.competition}</p>
                    )}
                  </div>
                  {/* Badges de disponibilidad */}
                  {(() => {
                    const av = availabilityByMatch.get(m.id)
                    if (!av || (av.available === 0 && av.doubt === 0 && av.unavailable === 0)) return null
                    return (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {av.available > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(75,226,119,0.1)', color: 'var(--accent)' }}>
                            ✓{av.available}
                          </span>
                        )}
                        {av.doubt > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
                            ?{av.doubt}
                          </span>
                        )}
                        {av.unavailable > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                            ✗{av.unavailable}
                          </span>
                        )}
                      </div>
                    )
                  })()}
                  {/* Acciones */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Link href={`/dashboard/season/${seasonId}/match/${m.id}`}
                      className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
                      title="Ver partido" style={{ color: 'var(--tx-3)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_right</span>
                    </Link>
                    <DeleteMatchButton matchId={m.id} seasonId={seasonId} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Aviso partidos sin datos ─────────────────────────────────── */}
        {pendingData > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border px-4 py-3"
            style={{ borderColor: 'rgba(234,179,8,0.2)', backgroundColor: 'rgba(234,179,8,0.04)' }}>
            <span className="material-symbols-outlined flex-shrink-0" style={{ color: '#facc15', fontSize: 18 }}>pending_actions</span>
            <p className="text-sm flex-1" style={{ color: '#facc15' }}>
              {pendingData} partido{pendingData !== 1 ? 's' : ''} sin estadísticas de jugadoras — pulsa ✏️ para rellenarlos
            </p>
          </div>
        )}

        {/* ── Tabla de Partidos ────────────────────────────────────────── */}
        <section
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}
        >
          {/* Cabecera de la tabla */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <TeamLogo name={team.name} logoUrl={team.logo_url} size="sm" />
              <h3 className="text-[13px] font-bold uppercase tracking-wide" style={{ color: 'var(--tx-3)' }}>
                Resultados
              </h3>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link
                href={`/dashboard/season/${seasonId}/stats`}
                className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors"
                style={{ backgroundColor: 'var(--accent-subtle)', borderColor: 'var(--bdr)', color: 'var(--accent)' }}
              >
                Stats
              </Link>
              <Link
                href={`/dashboard/season/${seasonId}/convocatorias`}
                className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors hidden sm:flex items-center"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)' }}
              >
                Convocatorias
              </Link>
              <Link
                href={`/dashboard/season/${seasonId}/convocatorias`}
                className="sm:hidden flex items-center justify-center w-8 h-7 rounded border transition-colors"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)' }}
                title="Convocatorias"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>groups</span>
              </Link>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: 'var(--bdr-strong)' }}>sports_soccer</span>
              <p className="text-sm" style={{ color: 'var(--tx-2)' }}>
                {searchQ ? `Sin resultados para "${searchQ}"` : 'Aún no hay partidos en esta temporada.'}
              </p>
            </div>
          ) : (
            <>
              {filtered.map(match => {
                const gf = match.goals_for ?? 0
                const ga = match.goals_against ?? 0
                const res = gf > ga ? 'V' : gf < ga ? 'D' : 'E'
                const resColor = res === 'V' ? 'var(--accent)' : res === 'D' ? '#ef4444' : '#f59e0b'
                const apps = match.appearances as AppRow[]
                const hasData = apps.length > 0
                const scorers = apps
                  .filter(a => (a.goals ?? 0) > 0)
                  .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))
                  .map(a => {
                    const first = a.players?.name?.split(' ')[0] ?? '?'
                    return (a.goals ?? 0) > 1 ? `${first} ×${a.goals}` : first
                  })
                const hasConvocatoria = (match.convocatorias as { id: string }[])?.length > 0
                const ct = (match as MatchWithType).competition_type ?? 'liga'
                const matchDate = new Date(match.played_at + 'T12:00:00')

                return (
                  <div key={match.id}
                    className="flex items-center last:border-0 transition-colors group hover:bg-[var(--bg-elevated)]"
                    style={{ borderBottom: '1px solid var(--bdr-strong)', borderLeft: `3px solid ${resColor}` }}
                  >

                    {/* Fecha */}
                    <div className="flex-shrink-0 w-12 md:w-14 text-center py-4 pl-3">
                      <div className="text-[10px] font-bold uppercase leading-none" style={{ color: 'var(--tx-3)', letterSpacing: '0.06em' }}>
                        {matchDate.toLocaleDateString('es-ES', { month: 'short' })}
                      </div>
                      <div className="text-xl md:text-[22px] font-black leading-snug" style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>
                        {matchDate.getDate()}
                      </div>
                    </div>

                    {/* Rival + info */}
                    <div className="flex-1 min-w-0 py-4 px-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {(match as { rival_logo_url?: string | null }).rival_logo_url && (
                          <div className="w-5 h-5 flex-shrink-0 overflow-hidden rounded" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--bdr-strong)' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={(match as { rival_logo_url: string }).rival_logo_url} alt="" className="w-full h-full object-contain" />
                          </div>
                        )}
                        <p className="text-[15px] font-semibold truncate leading-tight" style={{ color: 'var(--tx)' }}>{match.opponent}</p>
                        {ct === 'copa' && (
                          <span className="flex-shrink-0 text-[10px] font-bold" style={{ color: '#60a5fa' }}>Copa</span>
                        )}
                        {ct === 'amistoso' && (
                          <span className="flex-shrink-0 text-[10px] font-bold" style={{ color: 'var(--tx-3)' }}>Amistoso</span>
                        )}
                      </div>
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--tx-3)' }}>
                        {match.home ? 'Local' : 'Visitante'}
                        {scorers.length > 0 && <span> · {scorers.slice(0, 3).join(' · ')}</span>}
                        {!hasData && <span style={{ color: '#92400e' }}> · sin datos</span>}
                      </p>
                    </div>

                    {/* Marcador */}
                    <div className="flex-shrink-0 flex items-center gap-1.5 py-4 px-2 md:px-3">
                      {hasConvocatoria && (
                        <span className="material-symbols-outlined hidden md:block" style={{ fontSize: 13, color: 'var(--accent)' }}
                          title="Convocatoria realizada">check_circle</span>
                      )}
                      <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
                        style={{ backgroundColor: `${resColor}0d`, border: `1px solid ${resColor}22` }}>
                        <span className="text-[20px] md:text-[24px] font-black tabular-nums leading-none"
                          style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>{gf}</span>
                        <span className="text-xs font-bold" style={{ color: `${resColor}80` }}>–</span>
                        <span className="text-[20px] md:text-[24px] font-black tabular-nums leading-none"
                          style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>{ga}</span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex-shrink-0 flex items-center py-2 pr-2 md:pr-4 gap-0.5">
                      <Link
                        href={`/dashboard/season/${seasonId}/match/${match.id}`}
                        className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]"
                        title="Ver partido"
                        style={{ color: 'var(--tx-3)' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_right</span>
                      </Link>
                      <DeleteMatchButton matchId={match.id} seasonId={seasonId} />
                    </div>
                  </div>
                )
              })}

              <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid var(--bdr-strong)' }}>
                <p className="text-[11px]" style={{ color: 'var(--tx-3)' }}>
                  {filtered.length} partido{filtered.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-3 text-[11px] font-bold tabular-nums">
                  {wins > 0 && <span style={{ color: 'var(--accent)' }}>{wins}V</span>}
                  {draws > 0 && <span style={{ color: '#f59e0b' }}>{draws}E</span>}
                  {losses > 0 && <span style={{ color: '#ef4444' }}>{losses}D</span>}
                </div>
              </div>
            </>
          )}
        </section>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer className="mt-8" style={{ color: 'var(--tx-3)' }}>
          <p className="text-[11px]">© {new Date().getFullYear()} Coachly · {team.name}</p>
        </footer>

      </main>
    </PageTransition>
  )
}
