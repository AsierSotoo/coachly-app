import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { PageTransition } from '@/components/ui/page-transition'
import { PlayerAvatar } from '@/components/team/player-avatar'
import { getTeamTerms } from '@/lib/team-terms'
import { updatePlayerBio } from '@/app/dashboard/team/actions'

export default async function PlayerDetailPage({
  params, searchParams,
}: {
  params: Promise<{ id: string; playerId: string }>
  searchParams: Promise<{ saved?: string }>
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

  const { data: appearances } = await supabase
    .from('appearances')
    .select('*, matches(season_id, seasons(id, name, created_at))')
    .eq('player_id', playerId)

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

        {/* ── HERO ─────────────────────────────────────────── */}
        <div className="relative mb-5 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />

          <div className="flex items-center gap-4">
            <PlayerAvatar
              name={player.name}
              photoUrl={player.photo_url}
              position={player.position}
              size="lg"
              className="h-16 w-16 rounded-2xl"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {player.number !== null && (
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 font-[family-name:var(--font-heading)] text-xs font-black text-green-400">
                    {player.number}
                  </span>
                )}
                {player.position && (
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${posClass}`}>
                    {posDisplay}
                  </span>
                )}
              </div>
              <h1 className="font-[family-name:var(--font-heading)] text-xl font-black text-white leading-tight truncate">
                {player.name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">{team.name}</p>
              {player.bio && (
                <p className="text-xs mt-2 leading-relaxed" style={{ color: '#94a3b8' }}>{player.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Bio editable */}
        <div className="mb-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2.5">
            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 16 }}>edit_note</span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Descripción</p>
            {sp.saved && (
              <span className="ml-auto text-[10px] font-bold" style={{ color: '#4be277' }}>Guardado ✓</span>
            )}
          </div>
          <form action={updatePlayerBio} className="p-3 flex flex-col gap-2">
            <input type="hidden" name="player_id" value={player.id} />
            <input type="hidden" name="team_id" value={teamId} />
            <textarea
              name="bio"
              rows={2}
              defaultValue={player.bio ?? ''}
              placeholder="Perfil del jugador/a, puntos fuertes, notas del entrenador..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs resize-none focus:border-green-500/60 focus:outline-none transition-colors"
              style={{ color: '#dce1fb' }}
            />
            <button type="submit"
              className="self-end px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
              style={{ backgroundColor: '#22c55e', color: '#003915' }}>
              Guardar
            </button>
          </form>
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
                <StatGrid data={T} />
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
                      <StatGrid data={s} compact />
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

function StatCard({ title, seasonId, data, highlight }: { title: string; seasonId: string; data: StatData; highlight?: boolean }) {
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
      <StatGrid data={data} />
    </div>
  )
}

function StatGrid({ data, compact }: { data: StatData; compact?: boolean }) {
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
    </>
  )
}
