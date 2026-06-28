import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { PageTransition } from '@/components/ui/page-transition'
import { TeamLogo } from '@/components/team/team-logo'
import { PlayerAvatar } from '@/components/team/player-avatar'
import { getTeamTerms } from '@/lib/team-terms'
import type { Metadata } from 'next'

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

export default async function StatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: seasonId } = await params
  const supabase = await createClient()

  const { data: season } = await supabase.from('seasons').select('*, teams(*)').eq('id', seasonId).single()
  if (!season) notFound()

  const team = season.teams as { id: string; name: string; logo_url?: string | null; gender?: string | null }
  const terms = getTeamTerms(team.gender)

  const { data: matches } = await supabase
    .from('matches').select('*').eq('season_id', seasonId).order('played_at')

  const matchIdsList = matches?.map(m => m.id) ?? []
  const { data: appearances } = matchIdsList.length
    ? await supabase.from('appearances').select('*, players(name, number, position, photo_url)').in('match_id', matchIdsList)
    : { data: [] }

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
  const streakColor = currentStreakType === 'win' ? '#4be277' : currentStreakType === 'loss' ? '#ffb4ab' : '#adb4ce'

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
  const byGoals   = [...stats].sort((a, b) => b.goals - a.goals).filter(s => s.goals > 0)
  const byAssists = [...stats].sort((a, b) => b.assists - a.assists).filter(s => s.assists > 0)
  const byMinutes = [...stats].sort((a, b) => b.minutes - a.minutes).filter(s => s.minutes > 0)
  const byCards   = [...stats].filter(s => s.yellowCards > 0 || s.redCards > 0).sort((a, b) => (b.yellowCards + b.redCards * 2) - (a.yellowCards + a.redCards * 2))
  const byGames   = [...stats].sort((a, b) => b.gamesPlayed - a.gamesPlayed).filter(s => s.gamesPlayed > 0)

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

  // Bar chart: last 10 matches, newest first
  const last10       = matchesChron.slice(0, 10)
  const maxGoalsBar  = Math.max(...last10.map(m => Math.max(m.goals_for, m.goals_against)), 1)

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
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>Temporada:</span>
            <span className="px-4 py-2 rounded-lg border text-sm font-bold" style={{ backgroundColor: '#191f31', borderColor: '#2e3447', color: '#dce1fb' }}>
              {season.name}
            </span>
          </div>
        </header>

        {total === 0 ? (
          <div className="rounded-[24px] border-2 border-dashed border-[#2e3447]/50 py-16 text-center">
            <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: '#2e3447' }}>leaderboard</span>
            <p className="text-sm" style={{ color: '#adb4ce' }}>Sin partidos registrados en esta temporada</p>
          </div>
        ) : (
          <>
            {/* Hero: donut + métricas + racha */}
            <section
              className="mb-8 p-6 rounded-[24px] border flex flex-col md:flex-row gap-8 items-center relative overflow-hidden"
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
                      <circle cx="96" cy="96" r="80" fill="transparent" stroke="#94a3b8"
                        strokeDasharray={CIRCUM} strokeDashoffset={drawOffset}
                        strokeWidth="16"
                        transform={`rotate(${drawRotation} 96 96)`} />
                    )}
                    {/* Derrotas */}
                    {lossPct > 0 && (
                      <circle cx="96" cy="96" r="80" fill="transparent" stroke="#ffb4ab"
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
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-400" /><span className="text-[10px] font-bold uppercase" style={{ color: '#adb4ce' }}>E</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ffb4ab' }} /><span className="text-[10px] font-bold uppercase" style={{ color: '#adb4ce' }}>D</span></div>
                </div>
              </div>

              {/* 4 métricas */}
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {([
                  { label: 'Total Victorias', value: wins,         icon: 'trending_up',   sub: `${winRate}% partidos`,    subColor: '#4be277' },
                  { label: 'Goles a Favor',   value: goalsFor,     icon: 'sports_soccer', sub: `${avgFor} p/partido`,      subColor: '#4be277' },
                  { label: 'Goles en Contra', value: goalsAgainst, icon: 'security',      sub: `${avgAgainst} p/partido`, subColor: '#adb4ce' },
                  { label: 'Diferencia',       value: goalDiff > 0 ? `+${goalDiff}` : String(goalDiff), icon: goalDiff >= 0 ? 'add_circle' : 'remove_circle', sub: `${cleanSheets} portería${cleanSheets !== 1 ? 's' : ''} a cero`, subColor: goalDiff > 0 ? '#4be277' : goalDiff < 0 ? '#ffb4ab' : '#adb4ce' },
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
                          backgroundColor: s.win ? 'rgba(34,197,94,0.2)' : s.draw ? 'rgba(148,163,184,0.2)' : 'rgba(255,180,171,0.2)',
                          borderColor:     s.win ? '#22c55e' : s.draw ? '#94a3b8' : '#ffb4ab',
                          color:           s.win ? '#4be277' : s.draw ? '#94a3b8' : '#ffb4ab',
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
              <div className="mb-6 rounded-[24px] border p-5 flex items-center gap-5 relative overflow-hidden"
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

            {/* Líderes del Equipo */}
            <h3 className="text-[20px] font-semibold mb-4 pl-4 border-l-4 border-[#22c55e] text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              Líderes del Equipo
            </h3>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">

              {/* Goles */}
              <RankCard title="Goles" icon="workspace_premium"
                players={byGoals.slice(0, 3).map(s => ({ name: s.name, photoUrl: s.photoUrl, position: s.position, primary: s.goals }))}
              />

              {/* Asistencias */}
              <RankCard title="Asistencias" icon="alt_route"
                players={byAssists.slice(0, 3).map(s => ({ name: s.name, photoUrl: s.photoUrl, position: s.position, primary: s.assists }))}
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

              {/* Partidos */}
              <RankCard title="Partidos" icon="stadium"
                players={byGames.slice(0, 3).map(s => ({ name: s.name, photoUrl: s.photoUrl, position: s.position, primary: s.gamesPlayed }))}
              />
            </section>

            {/* Casa vs Fuera */}
            {total > 0 && (homeM.length > 0 || awayM.length > 0) && (
              <section className="mb-8 rounded-[24px] border p-6" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
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
                                { v: w, label: 'V', color: '#4be277', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
                                { v: d, label: 'E', color: '#adb4ce', bg: 'rgba(46,52,71,0.3)',  border: '#2e3447' },
                                { v: l, label: 'D', color: '#ffb4ab', bg: 'rgba(255,180,171,0.05)', border: 'rgba(255,180,171,0.2)' },
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
              <section className="rounded-[24px] border p-6" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
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

            {/* Desglose por competición */}
            {competitions.length >= 2 && (
              <section className="mt-8 rounded-[24px] border p-6" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
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
                            { v: c.W, lbl: 'V', color: '#4be277',  bg: 'rgba(34,197,94,0.1)',      border: 'rgba(34,197,94,0.2)' },
                            { v: c.E, lbl: 'E', color: '#adb4ce',  bg: 'rgba(46,52,71,0.3)',        border: '#2e3447' },
                            { v: c.D, lbl: 'D', color: '#ffb4ab',  bg: 'rgba(255,180,171,0.05)',    border: 'rgba(255,180,171,0.2)' },
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
          </>
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
        <div className="flex flex-col gap-4">
          {players.map((p, i) => (
            <div key={p.name + i} className="flex items-center justify-between"
              style={{ opacity: i === 0 ? 1 : i === 1 ? 0.8 : 0.6 }}>
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
                <span className="text-[20px] font-bold flex-shrink-0" style={{ color: '#4be277', fontFamily: 'Sora, sans-serif' }}>
                  {fmt(p.primary)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
