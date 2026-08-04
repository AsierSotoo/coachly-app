import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { PageTransition } from '@/components/ui/page-transition'
import { PlayerAvatar } from '@/components/team/player-avatar'
import { PlayerPhotoUpload } from '@/components/team/player-photo-upload'
import { getTeamTerms } from '@/lib/team-terms'
import { updatePlayer } from '@/app/dashboard/team/actions'
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

  const [{ data: player }, { data: team }] = await Promise.all([
    supabase.from('players').select('*').eq('id', playerId).single(),
    supabase.from('teams').select('id, name, gender').eq('id', teamId).single(),
  ])

  if (!player || !team) notFound()

  const terms = getTeamTerms((team as { gender?: string | null }).gender)

  const [{ data: appearances }, { data: trainingSessions }] = await Promise.all([
    supabase.from('appearances').select('*, matches(season_id, seasons(id, name, created_at))').eq('player_id', playerId),
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
    minutes: number; yellow: number; red: number
  }

  const map = new Map<string, SS>()
  for (const app of appearances ?? []) {
    const m = app.matches as { season_id: string; seasons: { id: string; name: string; created_at: string } }
    if (!m?.seasons) continue
    const { id, name, created_at } = m.seasons
    if (!map.has(id)) map.set(id, { seasonId: id, seasonName: name, createdAt: created_at, games: 0, goals: 0, assists: 0, minutes: 0, yellow: 0, red: 0 })
    const s = map.get(id)!
    if ((app.minutes ?? 0) > 0) s.games++
    s.goals += app.goals ?? 0
    s.assists += app.assists ?? 0
    s.minutes += app.minutes ?? 0
    s.yellow += app.yellow_cards ?? 0
    s.red += app.red_cards ?? 0
  }

  const seasons = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const current = seasons[0]
  const rest = seasons.slice(1)

  const T = seasons.reduce(
    (a, s) => ({ games: a.games + s.games, goals: a.goals + s.goals, assists: a.assists + s.assists, minutes: a.minutes + s.minutes, yellow: a.yellow + s.yellow, red: a.red + s.red }),
    { games: 0, goals: 0, assists: 0, minutes: 0, yellow: 0, red: 0 }
  )

  const posClass = terms.posBadgeClass(player.position)
  const posDisplay = terms.posLabel(player.position)

  return (
    <PageTransition>
      <main className="mx-auto max-w-2xl px-4 py-6 pb-10">

        <Link href={`/dashboard/team/${teamId}/players`} className="mb-5 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span> Plantilla
        </Link>

        {sp.error === 'has_appearances' && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm" style={{ color: '#f87171' }}>
            Esta jugadora tiene partidos registrados. Para retirarla de la plantilla sin perder su historial, usa el botón <strong>Inactiva</strong> en la lista de jugadoras.
          </div>
        )}

        {/* ── FICHA EDITABLE ───────────────────────────────── */}
        <div className="mb-5 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-3">
            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 16 }}>edit</span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ficha del jugador/a</p>
            {sp.saved && (
              <span className="ml-auto text-[10px] font-bold" style={{ color: '#4be277' }}>✓ Guardado</span>
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
                    style={{ color: '#dce1fb', minHeight: 'auto', fontSize: 14 }} />
                </div>
                <div className="w-20 flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dorsal</label>
                  <input name="number" type="number" min="1" max="99" defaultValue={player.number ?? ''}
                    placeholder="—"
                    className="h-10 rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-center focus:border-green-500/60 focus:outline-none transition-colors"
                    style={{ color: '#dce1fb', minHeight: 'auto', fontSize: 14 }} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Posición</label>
                <select name="position" defaultValue={player.position ?? ''}
                  className="h-10 rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm focus:border-green-500/60 focus:outline-none transition-colors appearance-none"
                  style={{ color: '#dce1fb', minHeight: 'auto', fontSize: 14 }}>
                  <option value="">Sin posición</option>
                  {terms.positions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Descripción / notas</label>
                <textarea name="bio" rows={5} defaultValue={player.bio ?? ''}
                  placeholder="Perfil, puntos fuertes, notas del entrenador..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm resize-y focus:border-green-500/60 focus:outline-none transition-colors leading-relaxed"
                  style={{ color: '#dce1fb', minHeight: 'auto', fontSize: 14 }} />
              </div>

              <div className="flex items-center justify-between">
                <DeletePlayerButton playerId={player.id} teamId={teamId} />
                <button type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
                  style={{ backgroundColor: '#22c55e', color: '#003915' }}>
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>

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
                data={current}
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
                      <StatGrid data={s} compact attendance={trainingAttBySeason.get(s.seasonId)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </PageTransition>
  )
}

/* ── Componentes locales ───────────────────────────────── */

type StatData = { games: number; goals: number; assists: number; minutes: number; yellow: number; red: number }
type AttendanceData = { attended: number; total: number }

function AttendanceBar({ attended, total }: AttendanceData) {
  const pct = Math.round((attended / total) * 100)
  const barColor  = pct >= 80 ? '#22c55e' : pct >= 60 ? '#eab308' : '#ef4444'
  const textColor = pct >= 80 ? '#4be277' : pct >= 60 ? '#facc15' : '#f87171'
  return (
    <div className="flex items-center gap-3 border-t border-slate-800/60 px-5 py-2.5">
      <span className="material-symbols-outlined text-slate-700" style={{ fontSize: 12 }}>fitness_center</span>
      <span className="text-[10px] text-slate-700 uppercase tracking-wide mr-auto">Entrenos</span>
      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
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
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: highlight ? '#4be277' : '#94a3b8' }}>target</span>
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
      {attendance && attendance.total > 0 && <AttendanceBar attended={attendance.attended} total={attendance.total} />}
    </>
  )
}
