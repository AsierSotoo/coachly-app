import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { PageTransition } from '@/components/ui/page-transition'
import { PlayerAvatar } from '@/components/team/player-avatar'
import { PlayerPhotoUpload } from '@/components/team/player-photo-upload'
import { getTeamTerms } from '@/lib/team-terms'
import { updatePlayer, serveYellowCycle } from '@/app/dashboard/team/actions'
import { DeletePlayerButton } from '@/components/team/delete-player-button'

export default async function PlayerDetailPage({
  params, searchParams,
}: {
  params: Promise<{ id: string; playerId: string }>
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const { id: teamId, playerId } = await params
  const sp = await searchParams
  const supabase = await createClient()

  const [{ data: player }, { data: team }, { data: allPlayers }] = await Promise.all([
    supabase.from('players').select('*').eq('id', playerId).single(),
    supabase.from('teams').select('id, name, gender').eq('id', teamId).single(),
    supabase.from('players').select('id, name, number').eq('team_id', teamId).eq('active', true).order('number', { ascending: true, nullsFirst: false }),
  ])

  if (!player || !team) notFound()

  const playerIdx  = allPlayers?.findIndex(p => p.id === playerId) ?? -1
  const prevPlayer = playerIdx > 0 ? allPlayers![playerIdx - 1] : null
  const nextPlayer = playerIdx < (allPlayers?.length ?? 0) - 1 ? allPlayers![playerIdx + 1] : null

  const terms = getTeamTerms((team as { gender?: string | null }).gender)

  const [{ data: appearances }, { data: trainingSessions }] = await Promise.all([
    supabase.from('appearances').select('*, matches(season_id, mvp_player_id, goals_against, played_at, opponent, seasons(id, name, created_at))').eq('player_id', playerId),
    supabase.from('training_sessions').select('id, season_id').eq('team_id', teamId),
  ])

  const sessionIds = trainingSessions?.map(s => s.id) ?? []
  const { data: playerAttendance } = sessionIds.length > 0
    ? await supabase.from('training_attendance').select('session_id, attended').eq('player_id', playerId).in('session_id', sessionIds)
    : { data: [] as Array<{ session_id: string; attended: boolean }> }

  const sessionSeasonMap = new Map<string, string>()
  for (const ts of trainingSessions ?? []) sessionSeasonMap.set(ts.id, ts.season_id)

  const trainingAttBySeason = new Map<string, { attended: number; total: number }>()
  for (const a of playerAttendance ?? []) {
    const sid = sessionSeasonMap.get(a.session_id)
    if (!sid) continue
    if (!trainingAttBySeason.has(sid)) trainingAttBySeason.set(sid, { attended: 0, total: 0 })
    const st = trainingAttBySeason.get(sid)!
    st.total++
    if (a.attended) st.attended++
  }

  const totalAtt = { attended: 0, total: 0 }
  for (const v of trainingAttBySeason.values()) {
    totalAtt.attended += v.attended
    totalAtt.total    += v.total
  }

  type SS = {
    seasonId: string; seasonName: string; createdAt: string
    games: number; goals: number; assists: number
    minutes: number; yellow: number; red: number; mvp: number
  }

  const map = new Map<string, SS>()
  for (const app of appearances ?? []) {
    const m = app.matches as { season_id: string; mvp_player_id?: string | null; seasons: { id: string; name: string; created_at: string } }
    if (!m?.seasons) continue
    const { id, name, created_at } = m.seasons
    if (!map.has(id)) map.set(id, { seasonId: id, seasonName: name, createdAt: created_at, games: 0, goals: 0, assists: 0, minutes: 0, yellow: 0, red: 0, mvp: 0 })
    const s = map.get(id)!
    if ((app.minutes ?? 0) > 0) s.games++
    s.goals += app.goals ?? 0
    s.assists += app.assists ?? 0
    s.minutes += app.minutes ?? 0
    s.yellow += app.yellow_cards ?? 0
    s.red += app.red_cards ?? 0
    if (m.mvp_player_id === playerId) s.mvp++
  }

  // Rating global y por temporada
  const ratingBySeason = new Map<string, { sum: number; count: number }>()
  let ratingSum = 0, ratingCount = 0
  for (const app of appearances ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = (app as any).rating as number | null
    if (r && r >= 1) {
      ratingSum += r; ratingCount++
      const m = app.matches as { season_id: string } | null
      if (m?.season_id) {
        const prev = ratingBySeason.get(m.season_id) ?? { sum: 0, count: 0 }
        ratingBySeason.set(m.season_id, { sum: prev.sum + r, count: prev.count + 1 })
      }
    }
  }
  const avgRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null

  const seasons = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const current = seasons[0]
  const rest = seasons.slice(1)

  const T = seasons.reduce(
    (a, s) => ({ games: a.games + s.games, goals: a.goals + s.goals, assists: a.assists + s.assists, minutes: a.minutes + s.minutes, yellow: a.yellow + s.yellow, red: a.red + s.red, mvp: a.mvp + s.mvp }),
    { games: 0, goals: 0, assists: 0, minutes: 0, yellow: 0, red: 0, mvp: 0 }
  )

  // Titular vs suplente (global, todas las temporadas)
  type RoleStats = { games: number; goals: number; assists: number; minutes: number }
  const starterStats: RoleStats = { games: 0, goals: 0, assists: 0, minutes: 0 }
  const subStats: RoleStats    = { games: 0, goals: 0, assists: 0, minutes: 0 }
  let cleanSheets = 0
  const isGK = player.position === 'Portera' || player.position === 'Portero'

  for (const app of appearances ?? []) {
    const mins = app.minutes ?? 0
    const target = app.starter ? starterStats : subStats
    if (mins > 0) target.games++
    target.goals   += app.goals        ?? 0
    target.assists += app.assists      ?? 0
    target.minutes += mins
    if (isGK && mins > 0) {
      const m = app.matches as { goals_against: number }
      if (m?.goals_against === 0) cleanSheets++
    }
  }

  const posClass = terms.posBadgeClass(player.position)
  const posDisplay = terms.posLabel(player.position)

  // Ranking en plantilla (temporada actual)
  let goalsRank = 0, assistsRank = 0, minutesRank = 0, rankTotal = 0
  if (current?.seasonId) {
    const { data: smIds } = await supabase.from('matches').select('id').eq('season_id', current.seasonId).neq('status', 'scheduled')
    const mIds = smIds?.map(m => m.id) ?? []
    if (mIds.length > 0) {
      const { data: tApps } = await supabase.from('appearances')
        .select('player_id, goals, assists, minutes').in('match_id', mIds).gt('minutes', 0)
      const pMap = new Map<string, { g: number; a: number; m: number }>()
      for (const app of tApps ?? []) {
        if (!pMap.has(app.player_id)) pMap.set(app.player_id, { g: 0, a: 0, m: 0 })
        const p = pMap.get(app.player_id)!
        p.g += app.goals ?? 0
        p.a += app.assists ?? 0
        p.m += app.minutes ?? 0
      }
      rankTotal = pMap.size
      const sortBy = (k: 'g' | 'a' | 'm') => [...pMap].sort((a, b) => b[1][k] - a[1][k])
      goalsRank   = sortBy('g').findIndex(([id]) => id === playerId) + 1
      assistsRank = sortBy('a').findIndex(([id]) => id === playerId) + 1
      minutesRank = sortBy('m').findIndex(([id]) => id === playerId) + 1
      // No mostrar posición si el stat es 0
      const curr = pMap.get(playerId)
      if (curr?.g === 0) goalsRank = 0
      if (curr?.a === 0) assistsRank = 0
    }
  }

  // Últimos 5 partidos en la temporada actual
  type MatchExt = { season_id: string; mvp_player_id?: string | null; goals_against: number; played_at: string; opponent: string; seasons: { id: string; name: string; created_at: string } }
  const last5 = (appearances ?? [])
    .filter(a => (a.matches as MatchExt | null)?.season_id === current?.seasonId)
    .sort((a, b) => ((a.matches as MatchExt | null)?.played_at ?? '').localeCompare((b.matches as MatchExt | null)?.played_at ?? ''))
    .slice(-5)

  // Historial de tarjetas
  const cardHistory = (appearances ?? [])
    .filter(a => (a.yellow_cards ?? 0) > 0 || (a.red_cards ?? 0) > 0)
    .sort((a, b) => ((a.matches as MatchExt | null)?.played_at ?? '').localeCompare((b.matches as MatchExt | null)?.played_at ?? ''))

  // Seguimiento de sanciones: amarillas efectivas en el ciclo actual
  const cyclesServed = (player as { yellow_card_cycles_served?: number }).yellow_card_cycles_served ?? 0
  const totalYellow  = T.yellow
  const effectiveYellow = totalYellow - cyclesServed * 4
  const warnSanction = effectiveYellow >= 4
  const SANCTION_THRESHOLD = 4

  return (
    <PageTransition>
      <main className="mx-auto max-w-2xl px-4 py-6 pb-32 md:pb-10">

        <div className="mb-5 flex items-center justify-between">
          <Link href={`/dashboard/team/${teamId}/players`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span> Plantilla
          </Link>
          {allPlayers && allPlayers.length > 1 && (
            <div className="flex items-center gap-1">
              {prevPlayer ? (
                <Link href={`/dashboard/team/${teamId}/players/${prevPlayer.id}`}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors hover:bg-slate-800"
                  style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)' }} title={prevPlayer.name}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span>
                  <span className="hidden sm:inline max-w-[80px] truncate">{prevPlayer.name.split(' ')[0]}</span>
                </Link>
              ) : (
                <span className="flex items-center px-2.5 py-1 rounded-lg border opacity-25 text-[11px]"
                  style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span>
                </span>
              )}
              <span className="text-[10px] px-1.5 tabular-nums" style={{ color: 'var(--tx-3)' }}>
                {playerIdx + 1}/{allPlayers.length}
              </span>
              {nextPlayer ? (
                <Link href={`/dashboard/team/${teamId}/players/${nextPlayer.id}`}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors hover:bg-slate-800"
                  style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)' }} title={nextPlayer.name}>
                  <span className="hidden sm:inline max-w-[80px] truncate">{nextPlayer.name.split(' ')[0]}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                </Link>
              ) : (
                <span className="flex items-center px-2.5 py-1 rounded-lg border opacity-25 text-[11px]"
                  style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                </span>
              )}
            </div>
          )}
        </div>

        {sp.error === 'has_appearances' && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm" style={{ color: '#f87171' }}>
            Esta jugadora tiene partidos registrados. Para retirarla de la plantilla sin perder su historial, usa el botón <strong>Inactiva</strong> en la lista de jugadoras.
          </div>
        )}

        {/* ── FICHA EDITABLE ───────────────────────────────── */}
        <div className="mb-5 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-3">
            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 16 }}>edit</span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ficha del {terms.p}</p>
            {sp.saved && (
              <span className="ml-auto text-[10px] font-bold" style={{ color: 'var(--accent)' }}>✓ Guardado</span>
            )}
          </div>

          <div className="p-5 flex flex-col sm:flex-row gap-5">
            {/* Foto */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <PlayerPhotoUpload
                playerId={player.id}
                currentUrl={player.photo_url}
                playerName={player.name}
                circular
                className="relative flex h-24 w-24 rounded-full cursor-pointer items-center justify-center overflow-hidden border-2 border-slate-700 bg-slate-800 hover:border-green-500/50 transition-all group"
              />
              <p className="text-[9px] text-slate-600 text-center">Toca para cambiar foto</p>
            </div>

            {/* Campos */}
            <form action={updatePlayer} className="flex-1 flex flex-col gap-3">
              <input type="hidden" name="player_id" value={player.id} />
              <input type="hidden" name="team_id" value={teamId} />

              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nombre</label>
                  <input name="name" type="text" required defaultValue={player.name}
                    className="h-10 rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm focus:border-green-500/60 focus:outline-none transition-colors"
                    style={{ color: 'var(--tx)', minHeight: 'auto', fontSize: 14 }} />
                </div>
                <div className="w-20 flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dorsal</label>
                  <input name="number" type="number" min="1" max="99" defaultValue={player.number ?? ''}
                    placeholder="—"
                    className="h-10 rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-center focus:border-green-500/60 focus:outline-none transition-colors"
                    style={{ color: 'var(--tx)', minHeight: 'auto', fontSize: 14 }} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Posición</label>
                <select name="position" defaultValue={player.position ?? ''}
                  className="h-10 rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm focus:border-green-500/60 focus:outline-none transition-colors appearance-none"
                  style={{ color: 'var(--tx)', minHeight: 'auto', fontSize: 14 }}>
                  <option value="">Sin posición</option>
                  {terms.positions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Descripción / notas</label>
                <textarea name="bio" rows={5} defaultValue={player.bio ?? ''}
                  placeholder="Perfil, puntos fuertes, notas del entrenador..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm resize-y focus:border-green-500/60 focus:outline-none transition-colors leading-relaxed"
                  style={{ color: 'var(--tx)', minHeight: 'auto', fontSize: 14 }} />
              </div>

              <div className="flex items-center justify-between">
                <DeletePlayerButton playerId={player.id} teamId={teamId} />
                <button type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}>
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Ranking en plantilla ─────────────────────────────────── */}
        {rankTotal > 1 && current && (
          <div className="mb-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2.5">
              <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 14 }}>leaderboard</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ranking en plantilla · {current.seasonName}</p>
              <span className="ml-auto text-[10px]" style={{ color: 'var(--bdr-strong)' }}>{rankTotal} jugadoras</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-800">
              {[
                { label: 'Goles',       rank: goalsRank,   icon: 'sports_soccer', color: '#72e697' },
                { label: 'Asistencias', rank: assistsRank, icon: 'electric_bolt', color: '#facc15' },
                { label: 'Minutos',     rank: minutesRank, icon: 'schedule',       color: '#60a5fa' },
              ].map(({ label, rank, icon, color }) => {
                const isTop = rank <= 3 && rank > 0
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
                return (
                  <div key={label} className="flex flex-col items-center gap-1 py-3">
                    <span className="material-symbols-outlined" style={{ fontSize: 13, color: isTop ? color : 'var(--tx-3)' }}>{icon}</span>
                    <p className="text-xl font-black leading-none tabular-nums" style={{ color: isTop ? color : 'var(--tx-3)', fontFamily: 'Sora, sans-serif' }}>
                      {medal ?? (rank > 0 ? `${rank}ª` : '—')}
                    </p>
                    <p className="text-[9px] uppercase tracking-wide" style={{ color: 'var(--tx-3)' }}>{label}</p>
                    <p className="text-[9px]" style={{ color: 'var(--tx-3)' }}>de {rankTotal}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Valoración media ─────────────────────────────────────── */}
        {avgRating !== null && (
          <div className="mb-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2.5">
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#fbbf24', fontVariationSettings: "'FILL' 1" }}>star</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Valoración del entrenador</p>
              <span className="ml-auto text-[10px]" style={{ color: 'var(--bdr-strong)' }}>{ratingCount} partido{ratingCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="px-4 py-3 flex items-center gap-4">
              <p className="text-[40px] font-extrabold leading-none tabular-nums" style={{ color: '#fbbf24', fontFamily: 'Sora, sans-serif' }}>{avgRating.toFixed(1)}</p>
              <div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className="material-symbols-outlined" style={{ fontSize: 20, color: '#fbbf24', fontVariationSettings: `'FILL' ${i < Math.round(avgRating) ? 1 : 0}` }}>star</span>
                  ))}
                </div>
                <p className="text-[10px] mt-1" style={{ color: 'var(--tx-3)' }}>valoración media de {ratingCount} partido{ratingCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Racha reciente ────────────────────────────────────────── */}
        {last5.length > 0 && (
          <div className="mb-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2.5">
              <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 14 }}>trending_up</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Últimos partidos</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-3">
              {last5.map((app, i) => {
                const m = app.matches as MatchExt | null
                const played  = (app.minutes ?? 0) > 0
                const scored  = (app.goals ?? 0) > 0
                const yellow  = (app.yellow_cards ?? 0) > 0
                const red     = (app.red_cards ?? 0) > 0
                const opp     = m?.opponent?.slice(0, 4)?.toUpperCase() ?? '?'
                const dot  = scored ? 'var(--accent)' : played ? '#3b82f6' : 'var(--bdr-strong)'
                const text = scored ? 'var(--accent)' : played ? '#60a5fa' : 'var(--tx-3)'
                return (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2"
                      style={{ borderColor: dot, backgroundColor: played ? `${dot}18` : 'transparent', color: text }}>
                      {scored ? '⚽' : played ? '●' : '○'}
                    </div>
                    <p className="text-[8px] uppercase tracking-wide truncate max-w-[36px] text-center" style={{ color: 'var(--tx-3)' }}>{opp}</p>
                    {(yellow || red) && (
                      <div className="w-2 h-2.5 rounded-[2px]" style={{ backgroundColor: red ? '#ef4444' : '#facc15' }} />
                    )}
                  </div>
                )
              })}
              <div className="ml-auto flex flex-col gap-1 pl-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                  <span className="text-[8px]" style={{ color: 'var(--tx-3)' }}>Con gol</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                  <span className="text-[8px]" style={{ color: 'var(--tx-3)' }}>Jugó</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full border" style={{ borderColor: 'var(--bdr-strong)' }} />
                  <span className="text-[8px]" style={{ color: 'var(--tx-3)' }}>No jugó</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Titular vs Suplente + Portería a cero ─────────────────── */}
        {T.games > 0 && (
          <div className="mb-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2.5">
              <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 14 }}>switch_access_shortcut</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Uso</p>
            </div>
            <div className={`grid divide-x divide-slate-800 ${isGK ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {[
                { label: 'Como titular', data: starterStats, icon: 'star', color: '#72e697' },
                { label: 'Como suplente', data: subStats, icon: 'swap_horiz', color: '#60a5fa' },
              ].map(({ label, data, icon, color }) => (
                <div key={label} className="px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="material-symbols-outlined" style={{ fontSize: 12, color }}>{icon}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: 'var(--tx-2)' }}>{label}</span>
                  </div>
                  <p className="text-lg font-black leading-none" style={{ color, fontFamily: 'Sora, sans-serif' }}>{data.games} PJ</p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--tx-2)' }}>
                    {data.goals}G · {data.assists}A · {data.minutes}&apos;
                  </p>
                </div>
              ))}
              {isGK && (
                <div className="px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#a78bfa' }}>security</span>
                    <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: 'var(--tx-2)' }}>Portería a cero</span>
                  </div>
                  <p className="text-lg font-black leading-none" style={{ color: '#a78bfa', fontFamily: 'Sora, sans-serif' }}>{cleanSheets}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--tx-2)' }}>de {T.games} partidos</p>
                </div>
              )}
            </div>
          </div>
        )}

        {seasons.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 py-14 text-center">
            <p className="text-sm text-slate-500">Sin partidos registrados aún.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">

            {/* ── TEMPORADA ACTUAL ─────────────────────────── */}
            {current && (
              <StatCard
                title={`Temporada ${current.seasonName}`}
                seasonId={current.seasonId}
                data={{
                  ...current,
                  avgRating: ratingBySeason.has(current.seasonId) ? Math.round(ratingBySeason.get(current.seasonId)!.sum / ratingBySeason.get(current.seasonId)!.count * 10) / 10 : undefined,
                  ratingCount: ratingBySeason.get(current.seasonId)?.count,
                }}
                highlight
                attendance={trainingAttBySeason.get(current.seasonId)}
              />
            )}

            {/* ── CARRERA TOTAL (solo si hay más de 1 temporada) ── */}
            {seasons.length > 1 && (
              <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur">
                <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
                  <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 18 }}>sports_score</span>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">Total carrera</h2>
                  <span className="ml-auto text-[10px] text-slate-600">{seasons.length} temporadas</span>
                </div>
                <StatGrid data={T} attendance={totalAtt.total > 0 ? totalAtt : undefined} />
              </div>
            )}

            {/* ── TEMPORADAS ANTERIORES ────────────────────── */}
            {rest.length > 0 && (
              <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur">
                <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
                  <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 18 }}>bar_chart</span>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">Temporadas anteriores</h2>
                </div>
                <div className="divide-y divide-slate-800">
                  {rest.map(s => (
                    <div key={s.seasonId}>
                      <div className="flex items-center justify-between px-4 pt-3 pb-1">
                        <p className="text-xs font-bold text-slate-400">{s.seasonName}</p>
                        <Link
                          href={`/dashboard/season/${s.seasonId}/stats`}
                          className="text-[10px] text-green-400/60 hover:text-green-400 transition-colors"
                        >
                          Ver stats →
                        </Link>
                      </div>
                      <StatGrid
                        data={{
                          ...s,
                          avgRating: ratingBySeason.has(s.seasonId) ? Math.round(ratingBySeason.get(s.seasonId)!.sum / ratingBySeason.get(s.seasonId)!.count * 10) / 10 : undefined,
                          ratingCount: ratingBySeason.get(s.seasonId)?.count,
                        }}
                        compact
                        attendance={trainingAttBySeason.get(s.seasonId)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── Historial de tarjetas ─────────────────────────── */}
        {cardHistory.length > 0 && (
          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-800" style={{ backgroundColor: 'var(--bg-base)' }}>
            <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-3">
              <span className="material-symbols-outlined text-slate-500" style={{ fontSize: 16 }}>style</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Historial de tarjetas</p>
              <span className="ml-auto text-[10px]" style={{ color: 'var(--bdr-strong)' }}>{cardHistory.length} partidos</span>
            </div>
            <div className="divide-y divide-slate-800/40">
              {cardHistory.map((app, i) => {
                const m = app.matches as MatchExt | null
                const date = m?.played_at
                  ? new Date(m.played_at + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' })
                  : '?'
                const season = m?.seasons?.name ?? ''
                return (
                  <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="text-[11px] tabular-nums flex-shrink-0 w-16" style={{ color: 'var(--tx-3)' }}>{date}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-400 truncate">vs {m?.opponent ?? '?'}</p>
                      {season && <p className="text-[10px]" style={{ color: 'var(--bdr-strong)' }}>{season}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {Array.from({ length: app.yellow_cards ?? 0 }).map((_, j) => (
                        <span key={`y${j}`} className="w-3 h-4 rounded-[2px]" style={{ backgroundColor: '#facc15' }} />
                      ))}
                      {Array.from({ length: app.red_cards ?? 0 }).map((_, j) => (
                        <span key={`r${j}`} className="w-3 h-4 rounded-[2px]" style={{ backgroundColor: '#ef4444' }} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── SEGUIMIENTO DE SANCIONES ──────────────────────── */}
        {totalYellow > 0 && (
          <div className={`mt-5 overflow-hidden rounded-3xl border ${warnSanction ? 'border-yellow-500/40' : 'border-slate-800'}`}
            style={{ backgroundColor: warnSanction ? 'rgba(234,179,8,0.04)' : 'var(--bg-base)' }}>
            <div className="flex items-center gap-2 border-b px-5 py-3" style={{ borderColor: warnSanction ? 'rgba(234,179,8,0.15)' : 'var(--bdr-strong)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: warnSanction ? '#facc15' : 'var(--tx-3)' }}>gavel</span>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: warnSanction ? '#facc15' : 'var(--tx-3)' }}>
                Seguimiento de sanciones
              </p>
            </div>
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl font-extrabold tabular-nums" style={{ color: warnSanction ? '#facc15' : 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>
                    {effectiveYellow}/{SANCTION_THRESHOLD}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--tx-3)' }}>amarillas en el ciclo actual</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: 'var(--bdr-strong)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((effectiveYellow / SANCTION_THRESHOLD) * 100, 100)}%`, backgroundColor: warnSanction ? '#facc15' : '#72e697' }} />
                </div>
                <p className="text-xs" style={{ color: 'var(--tx-3)' }}>
                  {cyclesServed > 0 ? `${cyclesServed} sanción${cyclesServed !== 1 ? 'es' : ''} cumplida${cyclesServed !== 1 ? 's' : ''} · ` : ''}
                  {warnSanction
                    ? '⚠️ Sanción activa — marca como cumplida tras el partido de suspensión'
                    : `Le faltan ${SANCTION_THRESHOLD - effectiveYellow} amarilla${SANCTION_THRESHOLD - effectiveYellow !== 1 ? 's' : ''} para sanción`}
                </p>
              </div>
              {warnSanction && (
                <form action={serveYellowCycle}>
                  <input type="hidden" name="player_id" value={player.id} />
                  <input type="hidden" name="team_id" value={teamId} />
                  <button type="submit"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                    style={{ backgroundColor: 'rgba(234,179,8,0.1)', borderColor: 'rgba(234,179,8,0.3)', color: '#facc15' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                    Sanción cumplida
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </main>
    </PageTransition>
  )
}

/* ── Componentes locales ───────────────────────────────── */

type StatData = { games: number; goals: number; assists: number; minutes: number; yellow: number; red: number; mvp: number; avgRating?: number; ratingCount?: number }
type AttendanceData = { attended: number; total: number }

function AttendanceBar({ attended, total }: AttendanceData) {
  const pct = Math.round((attended / total) * 100)
  const barColor  = pct >= 80 ? '#72e697' : pct >= 60 ? '#eab308' : '#ef4444'
  const textColor = pct >= 80 ? '#72e697' : pct >= 60 ? '#facc15' : '#f87171'
  return (
    <div className="flex items-center gap-3 border-t border-slate-800/60 px-5 py-2.5">
      <span className="material-symbols-outlined text-slate-700" style={{ fontSize: 12 }}>fitness_center</span>
      <span className="text-[10px] text-slate-700 uppercase tracking-wide mr-auto">Entrenos</span>
      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bdr-strong)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
      <span className="text-[11px] font-bold tabular-nums" style={{ color: textColor }}>
        {attended}/{total} ({pct}%)
      </span>
    </div>
  )
}

function StatCard({ title, seasonId, data, highlight, attendance }: { title: string; seasonId: string; data: StatData; highlight?: boolean; attendance?: AttendanceData }) {
  return (
    <div className={`overflow-hidden rounded-3xl border bg-slate-900/80 backdrop-blur ${highlight ? 'border-green-500/20' : 'border-slate-800'}`}>
      <div className={`flex items-center justify-between border-b px-4 py-3 ${highlight ? 'border-green-500/10 bg-green-500/5' : 'border-slate-800'}`}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: highlight ? 'var(--accent)' : '#94a3b8' }}>target</span>
          <h2 className={`text-xs font-bold uppercase tracking-widest ${highlight ? 'text-green-300' : 'text-slate-300'}`}>{title}</h2>
        </div>
        <Link
          href={`/dashboard/season/${seasonId}/stats`}
          className="text-[10px] text-green-400/60 hover:text-green-400 transition-colors"
        >
          Ver stats →
        </Link>
      </div>
      <StatGrid data={data} attendance={attendance} />
    </div>
  )
}

function StatGrid({ data, compact, attendance }: { data: StatData; compact?: boolean; attendance?: AttendanceData }) {
  const sz = compact ? 'text-2xl' : 'text-3xl'
  const py = compact ? 'py-3' : 'py-4'

  const goalsPer90 = data.minutes >= 90 ? (data.goals / data.minutes * 90).toFixed(2) : '—'
  const avgMin     = data.games > 0     ? Math.round(data.minutes / data.games)        : 0

  const items = [
    { icon: 'sports_score', label: 'PJ',    value: data.games,   color: 'text-white' },
    { icon: 'sports_soccer',label: 'Goles', value: data.goals,   color: 'text-green-400' },
    { icon: 'electric_bolt', label: 'Asist', value: data.assists, color: 'text-yellow-400' },
    { icon: 'schedule',      label: "Min'",  value: data.minutes, color: 'text-blue-400' },
  ]

  return (
    <>
      <div className={`grid grid-cols-4 divide-x divide-slate-800 ${py}`}>
        {items.map(({ icon, label, value, color }) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <span className={`material-symbols-outlined ${color} opacity-50`} style={{ fontSize: 14 }}>{icon}</span>
            <p className={`font-[family-name:var(--font-heading)] font-black leading-none ${sz} ${color}`}>{value}</p>
            <p className="text-[9px] uppercase tracking-wide text-slate-600">{label}</p>
          </div>
        ))}
      </div>

      {!compact && data.minutes > 0 && (
        <div className="grid grid-cols-2 divide-x divide-slate-800 border-t border-slate-800/60">
          <div className="flex items-center justify-center gap-2 py-2.5">
            <span className="text-[10px] text-slate-600 uppercase tracking-wide">G/90</span>
            <span className="text-sm font-bold text-green-400 font-sans tabular-nums">{goalsPer90}</span>
          </div>
          <div className="flex items-center justify-center gap-2 py-2.5">
            <span className="text-[10px] text-slate-600 uppercase tracking-wide">Min/PJ</span>
            <span className="text-sm font-bold text-blue-400 font-sans tabular-nums">{avgMin}</span>
          </div>
        </div>
      )}

      {(data.yellow > 0 || data.red > 0) && (
        <div className="flex items-center gap-4 border-t border-slate-800/60 px-5 py-2.5">
          <span className="material-symbols-outlined text-slate-700" style={{ fontSize: 12 }}>warning</span>
          <span className="text-[10px] text-slate-700 mr-auto">Tarjetas</span>
          {data.yellow > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="h-4 w-3 rounded-[3px] bg-yellow-400 shadow shadow-yellow-400/20" />
              <span className="font-[family-name:var(--font-heading)] text-sm font-black text-white">{data.yellow}</span>
            </div>
          )}
          {data.red > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="h-4 w-3 rounded-[3px] bg-red-500 shadow shadow-red-500/20" />
              <span className="font-[family-name:var(--font-heading)] text-sm font-black text-white">{data.red}</span>
            </div>
          )}
        </div>
      )}
      {data.mvp > 0 && (
        <div className="flex items-center gap-4 border-t border-slate-800/60 px-5 py-2.5">
          <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#facc15' }}>star</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wide mr-auto">Del partido</span>
          <span className="text-sm font-bold tabular-nums" style={{ color: '#facc15' }}>
            {data.mvp} vez{data.mvp !== 1 ? 'es' : ''}
          </span>
        </div>
      )}
      {data.avgRating != null && (
        <div className="flex items-center gap-3 border-t border-slate-800/60 px-5 py-2.5">
          <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#fbbf24', fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wide mr-auto">Valoración</span>
          <span className="text-sm font-bold tabular-nums" style={{ color: '#fbbf24' }}>{data.avgRating.toFixed(1)}</span>
          <span className="text-[10px] text-slate-600">/ 5</span>
          {data.ratingCount != null && <span className="text-[9px] text-slate-700">({data.ratingCount} PJ)</span>}
        </div>
      )}
      {attendance && attendance.total > 0 && <AttendanceBar attended={attendance.attended} total={attendance.total} />}
    </>
  )
}
