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
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function OpponentInitial({ name }: { name: string }) {
  const letters = name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div className="w-10 h-10 rounded flex items-center justify-center text-[11px] font-black border flex-shrink-0"
      style={{ backgroundColor: '#23293c', borderColor: '#2e3447', color: '#adb4ce' }}>
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

  const { data: season } = await supabase
    .from('seasons').select('*, teams(*)').eq('id', seasonId).single()
  if (!season) notFound()

  const { data: matchesRaw } = await supabase
    .from('matches')
    .select('*, convocatorias(id), appearances(id, goals, player_id, players(name))')
    .eq('season_id', seasonId)
    .order('played_at', { ascending: false })

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
  const sortedByDate = [...matches].sort((a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime())
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
  const streakColor = streakType === 'V' ? '#4be277' : streakType === 'D' ? '#f87171' : '#fbbf24'

  return (
    <PageTransition>
      <main className="max-w-7xl mx-auto px-4 md:px-10 py-6 md:py-8 pb-32 md:pb-10">

        {/* ── Stats Cards ─────────────────────────────────────────────── */}
        <section className="grid grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">

          {/* Victorias */}
          <div
            className="relative overflow-hidden rounded-xl border p-3 md:p-6 group hover:border-[#22c55e]/50 transition-colors"
            style={{ backgroundColor: '#151b2d', borderColor: '#2e3447' }}
          >
            <div className="absolute top-0 right-0 p-2 md:p-4 opacity-10 select-none pointer-events-none">
              <span className="material-symbols-outlined text-[40px] md:text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>trophy</span>
            </div>
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-1 md:mb-2" style={{ color: '#adb4ce' }}>Victorias</p>
            <div className="flex items-end gap-1 md:gap-2">
              <span className="text-[32px] md:text-[48px] font-extrabold leading-none" style={{ color: '#4be277', fontFamily: 'Sora, sans-serif' }}>{wins}</span>
              {total > 0 && (
                <span className="mb-1 text-[10px] md:text-xs font-bold hidden sm:flex items-center" style={{ color: '#4be277' }}>
                  {winRate}%
                </span>
              )}
            </div>
          </div>

          {/* Empates */}
          <div
            className="relative overflow-hidden rounded-xl border p-3 md:p-6 group hover:border-[#adb4ce]/30 transition-colors"
            style={{ backgroundColor: '#151b2d', borderColor: '#2e3447' }}
          >
            <div className="absolute top-0 right-0 p-2 md:p-4 opacity-10 select-none pointer-events-none">
              <span className="material-symbols-outlined text-[40px] md:text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>drag_handle</span>
            </div>
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-1 md:mb-2" style={{ color: '#adb4ce' }}>Empates</p>
            <div className="flex items-end gap-1 md:gap-2">
              <span className="text-[32px] md:text-[48px] font-extrabold leading-none" style={{ color: '#fbbf24', fontFamily: 'Sora, sans-serif' }}>{draws}</span>
              {total > 0 && (
                <span className="mb-1 text-[10px] md:text-xs font-bold hidden sm:flex items-center" style={{ color: '#adb4ce' }}>
                  {drawRate}%
                </span>
              )}
            </div>
          </div>

          {/* Derrotas */}
          <div
            className="relative overflow-hidden rounded-xl border p-3 md:p-6 group hover:border-[#f87171]/30 transition-colors"
            style={{ backgroundColor: '#151b2d', borderColor: '#2e3447' }}
          >
            <div className="absolute top-0 right-0 p-2 md:p-4 opacity-10 select-none pointer-events-none">
              <span className="material-symbols-outlined text-[40px] md:text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-1 md:mb-2" style={{ color: '#adb4ce' }}>Derrotas</p>
            <div className="flex items-end gap-1 md:gap-2">
              <span className="text-[32px] md:text-[48px] font-extrabold leading-none" style={{ color: '#f87171', fontFamily: 'Sora, sans-serif' }}>{losses}</span>
              {total > 0 && (
                <span className="mb-1 text-[10px] md:text-xs font-bold hidden sm:flex items-center" style={{ color: '#f87171' }}>
                  {lossRate}%
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ── Forma reciente ──────────────────────────────────────────── */}
        {recentForm.length > 0 && (
          <div className="flex items-center gap-3 mb-6 px-1">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>Forma</span>
            <div className="flex gap-1.5">
              {recentForm.map((r, i) => (
                <div key={i}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black border"
                  style={{
                    backgroundColor: r === 'V' ? 'rgba(75,226,119,0.12)' : r === 'D' ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.08)',
                    borderColor:     r === 'V' ? 'rgba(75,226,119,0.35)' : r === 'D' ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.25)',
                    color:           r === 'V' ? '#4be277' : r === 'D' ? '#f87171' : '#fbbf24',
                  }}>
                  {r}
                </div>
              ))}
            </div>
            <span className="text-[11px]" style={{ color: '#adb4ce' }}>
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
              <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: '#adb4ce' }}>Liga</span>
              {lp != null && lt != null ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold"
                  style={{ backgroundColor: 'rgba(75,226,119,0.08)', borderColor: 'rgba(75,226,119,0.2)', color: '#4be277' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>leaderboard</span>
                  {ordinal(lp)} de {lt}
                </span>
              ) : (
                <span className="text-[11px]" style={{ color: '#4b5563' }}>Sin datos</span>
              )}
              <form action={updateSeasonLeague} className="flex items-center gap-1.5 ml-auto">
                <input type="hidden" name="season_id" value={seasonId} />
                <input name="league_position" type="number" min="1" defaultValue={lp ?? ''} placeholder="Pos"
                  className="w-14 h-8 rounded-lg border px-1 text-sm text-center outline-none focus:border-[#4be277] transition-colors"
                  style={{ backgroundColor: '#191f31', borderColor: '#2e3447', color: '#dce1fb' }} />
                <span className="text-xs flex-shrink-0" style={{ color: '#4b5563' }}>/</span>
                <input name="league_total_teams" type="number" min="2" defaultValue={lt ?? ''} placeholder="Tot"
                  className="w-14 h-8 rounded-lg border px-1 text-sm text-center outline-none focus:border-[#4be277] transition-colors"
                  style={{ backgroundColor: '#191f31', borderColor: '#2e3447', color: '#dce1fb' }} />
                <button type="submit"
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border transition-colors hover:border-[#4be277] hover:text-[#4be277] active:scale-95"
                  style={{ backgroundColor: '#191f31', borderColor: '#2e3447', color: '#adb4ce' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                </button>
              </form>
            </div>
          )
        })()}

        {/* ── Mini leaderboard ─────────────────────────────────────────── */}
        {topScorers.length > 0 && (
          <div className="flex items-center gap-2 mb-5 px-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: '#adb4ce' }}>Goleadoras</span>
            {topScorers.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px]"
                style={{
                  backgroundColor: i === 0 ? 'rgba(75,226,119,0.08)' : 'rgba(46,52,71,0.3)',
                  borderColor: i === 0 ? 'rgba(75,226,119,0.2)' : '#2e3447',
                  color: i === 0 ? '#4be277' : '#adb4ce',
                }}>
                <span className="font-black" style={{ fontSize: 10, color: i === 0 ? '#4be277' : i === 1 ? '#adb4ce' : '#9d8050' }}>
                  {i === 0 ? '⚽' : `${i + 1}`}
                </span>
                <span className="font-semibold">{s.name.split(' ')[0]}</span>
                <span className="font-black">{s.goals}</span>
              </div>
            ))}
            <Link href={`/dashboard/season/${seasonId}/stats`} className="text-[10px] font-bold ml-auto flex-shrink-0"
              style={{ color: '#4be277' }}>
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
              style={{ backgroundColor: '#22c55e', color: '#003915', fontFamily: 'Sora, sans-serif' }}
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Nuevo Partido
            </Link>
            <Link
              href={`/dashboard/team/${team.id}/players`}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm border active:scale-95 transition-all hover:bg-[#23293c]"
              style={{ backgroundColor: '#2e3447', borderColor: '#3d4a3d', color: '#dce1fb' }}
            >
              <span className="material-symbols-outlined text-lg">person_pin</span>
              <span>Plantilla</span>
            </Link>
            <Link
              href={`/dashboard/season/${seasonId}/trainings`}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm border active:scale-95 transition-all hover:bg-[#23293c]"
              style={{ backgroundColor: '#2e3447', borderColor: '#3d4a3d', color: '#dce1fb' }}
            >
              <span className="material-symbols-outlined text-lg">fitness_center</span>
              <span>Entrenos</span>
            </Link>
            <Link
              href={`/dashboard/season/${seasonId}/convocatorias`}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm border active:scale-95 transition-all hover:bg-[#23293c]"
              style={{ backgroundColor: '#2e3447', borderColor: '#3d4a3d', color: '#dce1fb' }}
            >
              <span className="material-symbols-outlined text-lg">groups</span>
              <span>Convocatorias</span>
            </Link>
            <Link
              href={`/dashboard/season/${seasonId}/calendar`}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm border active:scale-95 transition-all hover:bg-[#23293c]"
              style={{ backgroundColor: '#2e3447', borderColor: '#3d4a3d', color: '#dce1fb' }}
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
                  const color = r === 'V' ? '#4be277' : r === 'D' ? '#f87171' : r === 'E' ? '#fbbf24' : '#dce1fb'
                  const ctPart = ctFilter ? `&ct=${ctFilter}` : ''
                  const qPart = sp.q ? `&q=${sp.q}` : ''
                  return (
                    <a key={r}
                      href={`/dashboard/season/${seasonId}?${r ? `r=${r}` : ''}${ctPart}${qPart}`}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all"
                      style={{
                        backgroundColor: active ? `${color}18` : 'transparent',
                        borderColor: active ? `${color}50` : '#2e3447',
                        color: active ? color : '#adb4ce',
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
                        borderColor: active ? `${color}40` : '#2e3447',
                        color: active ? color : '#64748b',
                      }}>
                      {label}{ct && count > 0 ? ` ${count}` : ''}
                    </a>
                  )
                })}
              </div>
            )}
            {/* Buscador */}
            <form method="get" action={`/dashboard/season/${seasonId}`}
              className="flex items-center gap-2 rounded-lg border px-4 py-2.5 focus-within:border-[#4be277] transition-colors"
              style={{ backgroundColor: '#191f31', borderColor: '#2e3447' }}>
              {resultFilter && <input type="hidden" name="r" value={resultFilter} />}
              {ctFilter && <input type="hidden" name="ct" value={ctFilter} />}
              <span className="material-symbols-outlined" style={{ color: '#adb4ce', fontSize: 18 }}>search</span>
              <input
                name="q"
                type="text"
                placeholder="Buscar rival..."
                defaultValue={sp.q ?? ''}
                className="bg-transparent border-none outline-none text-sm w-36"
                style={{ color: '#dce1fb' }}
              />
            </form>
          </div>
        </section>

        {/* ── Formulario Nuevo Partido ─────────────────────────────────── */}
        {showForm && (
          <section
            className="mb-8 rounded-[24px] border border-[#1e293b] overflow-hidden"
            style={{ backgroundColor: '#0f172a' }}
          >
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1e293b]">
              <span className="material-symbols-outlined" style={{ color: '#4be277' }}>calendar_month</span>
              <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>Añadir al calendario</h3>
            </div>
            <p className="px-6 pt-4 text-xs" style={{ color: '#4b5563' }}>
              El partido quedará programado. Cuando acabe, entra en él y pulsa <strong style={{ color: '#adb4ce' }}>Finalizar partido</strong> para registrar el resultado.
            </p>
            <form action={createMatch} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="hidden" name="season_id" value={seasonId} />
              {opponents.length > 0 && (
                <datalist id="opponents-list">
                  {opponents.map(o => <option key={o} value={o} />)}
                </datalist>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>Rival</label>
                <input name="opponent" type="text" required placeholder="Nombre del rival" list="opponents-list"
                  className="border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#4be277] transition-all"
                  style={{ backgroundColor: '#0c1324', borderColor: '#2e3447', color: '#dce1fb' }} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>Fecha</label>
                <input name="played_at" type="date" required defaultValue={new Date().toISOString().split('T')[0]}
                  className="border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#4be277] transition-all"
                  style={{ backgroundColor: '#0c1324', borderColor: '#2e3447', color: '#dce1fb' }} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>Campo</label>
                <select name="home"
                  className="border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#4be277] transition-all appearance-none"
                  style={{ backgroundColor: '#0c1324', borderColor: '#2e3447', color: '#dce1fb' }}>
                  <option value="true">Local</option>
                  <option value="false">Visitante</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>Tipo</label>
                <select name="competition_type"
                  className="border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#4be277] transition-all appearance-none"
                  style={{ backgroundColor: '#0c1324', borderColor: '#2e3447', color: '#dce1fb' }}>
                  <option value="liga">🏆 Liga</option>
                  <option value="copa">🥈 Copa</option>
                  <option value="amistoso">🤝 Amistoso</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>Nombre competición</label>
                <input name="competition" type="text" placeholder="Liga Navarra, Copa..."
                  className="border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#4be277] transition-all"
                  style={{ backgroundColor: '#0c1324', borderColor: '#2e3447', color: '#dce1fb' }} />
              </div>

              <div className="md:col-span-2 flex items-end">
                <button type="submit"
                  className="w-full h-[50px] rounded-xl flex items-center justify-center gap-2 text-sm font-bold active:scale-95 transition-transform cursor-pointer"
                  style={{ backgroundColor: '#22c55e', color: '#003915' }}>
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
          <section className="mb-6 rounded-[24px] border border-[#1e293b] overflow-hidden" style={{ backgroundColor: '#070d1f' }}>
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-[#1e293b]" style={{ backgroundColor: '#191f31' }}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={{ color: '#adb4ce', fontSize: 18 }}>calendar_month</span>
                <h3 className="text-base font-semibold" style={{ color: '#dce1fb', fontFamily: 'Sora, sans-serif' }}>
                  Calendario · {scheduledMatches.length} partido{scheduledMatches.length !== 1 ? 's' : ''}
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded"
                style={{ backgroundColor: 'rgba(173,180,206,0.08)', color: '#adb4ce', border: '1px solid rgba(173,180,206,0.15)' }}>
                Programados
              </span>
            </div>
            <div>
              {scheduledMatches.map(m => (
                <Link key={m.id} href={`/dashboard/season/${seasonId}/match/${m.id}`}
                  className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-[#1e293b] last:border-0 hover:bg-[#0f172a] transition-colors group">
                  <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: '#151b2d', border: '1px solid #2e3447' }}>
                    <span className="text-[9px] font-bold uppercase leading-none" style={{ color: '#adb4ce' }}>
                      {new Date(m.played_at + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short' })}
                    </span>
                    <span className="text-[18px] font-black leading-tight" style={{ color: '#dce1fb', fontFamily: 'Sora, sans-serif' }}>
                      {new Date(m.played_at + 'T12:00:00').getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold truncate" style={{ color: '#dce1fb' }}>{m.opponent}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ backgroundColor: m.home ? 'rgba(75,226,119,0.1)' : 'rgba(173,180,206,0.08)', color: m.home ? '#4be277' : '#adb4ce' }}>
                        {m.home ? 'Local' : 'Visit.'}
                      </span>
                    </div>
                    {m.competition && (
                      <p className="text-[11px] truncate mt-0.5" style={{ color: '#4b5563' }}>{m.competition}</p>
                    )}
                  </div>
                  {/* Badges de disponibilidad */}
                  {(() => {
                    const av = availabilityByMatch.get(m.id)
                    if (!av || (av.available === 0 && av.doubt === 0 && av.unavailable === 0)) return null
                    return (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {av.available > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(75,226,119,0.1)', color: '#4be277' }}>
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
                  <span className="material-symbols-outlined flex-shrink-0 opacity-30 group-hover:opacity-60 transition-opacity" style={{ fontSize: 16, color: '#adb4ce' }}>
                    chevron_right
                  </span>
                </Link>
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
          className="rounded-[24px] border border-[#1e293b] overflow-hidden"
          style={{ backgroundColor: '#070d1f' }}
        >
          {/* Cabecera de la tabla */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b]"
            style={{ backgroundColor: '#191f31' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <TeamLogo name={team.name} logoUrl={team.logo_url} size="sm" />
              <h3 className="text-base md:text-[20px] font-semibold truncate" style={{ color: '#4be277', fontFamily: 'Sora, sans-serif' }}>
                Resultados
              </h3>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link
                href={`/dashboard/season/${seasonId}/stats`}
                className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors hover:border-[#4be277]/50"
                style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)', color: '#4be277' }}
              >
                Stats
              </Link>
              <Link
                href={`/dashboard/season/${seasonId}/convocatorias`}
                className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors hover:border-[#adb4ce]/30 hidden sm:flex items-center"
                style={{ backgroundColor: '#2e3447', borderColor: '#3d4a3d', color: '#adb4ce' }}
              >
                Convocatorias
              </Link>
              <Link
                href={`/dashboard/season/${seasonId}/convocatorias`}
                className="sm:hidden flex items-center justify-center w-8 h-7 rounded border transition-colors hover:border-[#adb4ce]/30"
                style={{ backgroundColor: '#2e3447', borderColor: '#3d4a3d', color: '#adb4ce' }}
                title="Convocatorias"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>groups</span>
              </Link>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: '#2e3447' }}>sports_soccer</span>
              <p className="text-sm" style={{ color: '#adb4ce' }}>
                {searchQ ? `Sin resultados para "${searchQ}"` : 'Aún no hay partidos en esta temporada.'}
              </p>
            </div>
          ) : (
            <>
              {/* Columnas */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1e293b]" style={{ backgroundColor: '#151b2d' }}>
                      <th className="px-3 md:px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-left" style={{ color: '#adb4ce' }}>Est.</th>
                      <th className="px-3 md:px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-left" style={{ color: '#adb4ce' }}>Oponente</th>
                      <th className="hidden md:table-cell px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-left" style={{ color: '#adb4ce' }}>Fecha</th>
                      <th className="hidden lg:table-cell px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-left" style={{ color: '#adb4ce' }}>Convocatoria</th>
                      <th className="px-3 md:px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: '#adb4ce' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(match => {
                      const gf = match.goals_for ?? 0
                      const ga = match.goals_against ?? 0
                      const res  = gf > ga ? 'V' : gf < ga ? 'D' : 'E'
                      const scoreColor = res === 'V' ? '#4be277' : res === 'D' ? '#f87171' : '#fbbf24'
                      const apps = match.appearances as AppRow[]
                      const hasData = apps.length > 0
                      const scorers = apps
                        .filter(a => (a.goals ?? 0) > 0)
                        .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))
                        .map(a => {
                          const first = a.players?.name?.split(' ')[0] ?? '?'
                          return (a.goals ?? 0) > 1 ? `${first} ×${a.goals}` : first
                        })
                      const dotStyle = res === 'V'
                        ? { backgroundColor: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.5)', color: '#003915' }
                        : res === 'D'
                          ? { backgroundColor: 'rgba(248,113,113,0.12)', boxShadow: '0 0 8px rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.4)' }
                          : { backgroundColor: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }

                      const hasConvocatoria = (match.convocatorias as { id: string }[])?.length > 0

                      return (
                        <tr key={match.id}
                          className="border-b border-[#1e293b] last:border-0 group transition-colors"
                          style={{ backgroundColor: 'transparent' }}
                          onMouseEnter={undefined}
                        >
                          {/* Est. */}
                          <td className="px-3 md:px-6 py-3 md:py-5">
                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs font-black" style={dotStyle}>
                              {res}
                            </div>
                          </td>

                          {/* Oponente */}
                          <td className="px-3 md:px-6 py-3 md:py-5 max-w-0">
                            <div className="flex items-center gap-2 md:gap-3">
                              {(match as { rival_logo_url?: string | null }).rival_logo_url ? (
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded flex items-center justify-center flex-shrink-0 overflow-hidden border border-[#2e3447] bg-white">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={(match as { rival_logo_url: string }).rival_logo_url} alt={match.opponent} className="w-full h-full object-contain p-1" />
                                </div>
                              ) : (
                                <OpponentInitial name={match.opponent} />
                              )}
                              <div className="min-w-0">
                                {(() => {
                                  const ct = (match as MatchWithType).competition_type ?? 'liga'
                                  const ctBadge = ct === 'copa'
                                    ? <span className="flex-shrink-0 inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>Copa</span>
                                    : ct === 'amistoso'
                                    ? <span className="flex-shrink-0 inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)' }}>Amistoso</span>
                                    : null
                                  return (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-sm font-bold text-white truncate">{match.opponent}</p>
                                      {ctBadge}
                                      {!hasData && (
                                        <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                                          style={{ backgroundColor: 'rgba(234,179,8,0.12)', color: '#facc15', border: '1px solid rgba(234,179,8,0.2)' }}>
                                          Sin datos
                                        </span>
                                      )}
                                    </div>
                                  )
                                })()}
                                {/* Móvil: resultado + local/vis inline */}
                                <p className="md:hidden text-[11px] mt-0.5 font-bold tabular-nums" style={{ color: scoreColor, fontFamily: 'Sora, sans-serif' }}>
                                  {gf}–{ga} · {match.home ? 'Local' : 'Vis.'}
                                </p>
                                {/* Desktop: local/vis + competición */}
                                <p className="hidden md:block text-[11px] mt-0.5 truncate" style={{ color: '#adb4ce' }}>
                                  {match.home ? 'Local' : 'Visitante'}{match.competition ? ` · ${match.competition}` : ''}
                                </p>
                                {/* Goleadoras */}
                                {scorers.length > 0 && (
                                  <p className="text-[10px] mt-0.5 flex items-center gap-1 truncate" style={{ color: '#4be277' }}>
                                    <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 11 }}>sports_soccer</span>
                                    {scorers.join(' · ')}
                                  </p>
                                )}
                                {match.notes && (
                                  <p className="hidden md:flex text-[11px] mt-1 items-center gap-1 max-w-[200px] truncate" style={{ color: '#64748b' }}>
                                    <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 12 }}>edit_note</span>
                                    {match.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Fecha — oculta en móvil */}
                          <td className="hidden md:table-cell px-6 py-5">
                            <p className="text-sm font-medium text-white">{dateStr(match.played_at)}</p>
                            <p className="text-[11px] mt-0.5 font-bold tabular-nums" style={{ color: scoreColor, fontFamily: 'Sora, sans-serif' }}>
                              {gf}–{ga}
                            </p>
                          </td>

                          {/* Convocatoria — oculta hasta lg */}
                          <td className="hidden lg:table-cell px-6 py-5">
                            {hasConvocatoria ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border"
                                style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)', color: '#4be277' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                Completada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border"
                                style={{ backgroundColor: 'rgba(234,179,8,0.1)', borderColor: 'rgba(234,179,8,0.2)', color: '#facc15' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>pending</span>
                                Pendiente
                              </span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="px-3 md:px-6 py-3 md:py-5">
                            <div className="flex items-center justify-end gap-1 md:gap-2">
                              {!hasConvocatoria && (
                                <Link
                                  href={`/dashboard/season/${seasonId}/convocatorias`}
                                  className="hidden md:inline-flex px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors hover:bg-[#22c55e]/10"
                                  style={{ backgroundColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)', color: '#4be277' }}
                                >
                                  Convocatoria
                                </Link>
                              )}
                              <Link
                                href={`/dashboard/season/${seasonId}/match/${match.id}`}
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors hover:bg-[#23293c]"
                                style={{ color: '#adb4ce' }}
                                title="Editar partido"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                              </Link>
                              <DeleteMatchButton matchId={match.id} seasonId={seasonId} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer de la tabla */}
              <div
                className="flex items-center justify-center px-6 py-4 border-t border-[#1e293b]"
                style={{ backgroundColor: '#0f172a' }}
              >
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>
                  {filtered.length} partido{filtered.length !== 1 ? 's' : ''} registrado{filtered.length !== 1 ? 's' : ''}
                </p>
              </div>
            </>
          )}
        </section>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer className="mt-8 flex items-center justify-between" style={{ color: '#adb4ce' }}>
          <p className="text-[11px]">© {new Date().getFullYear()} Coachly · {team.name}</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#4be277' }} />
              Sistema Online
            </span>
          </div>
        </footer>

      </main>
    </PageTransition>
  )
}
