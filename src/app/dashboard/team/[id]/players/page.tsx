import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { addPlayer, togglePlayerActive, updatePlayer } from '../../actions'
import Link from 'next/link'
import { PageTransition } from '@/components/ui/page-transition'
import { PlayerPhotoUpload } from '@/components/team/player-photo-upload'
import { PlayerAvatar } from '@/components/team/player-avatar'
import { getTeamTerms } from '@/lib/team-terms'
import { DownloadPlayersCsv } from '@/components/team/download-players-csv'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('teams').select('name').eq('id', id).single()
  return { title: data ? `Plantilla · ${data.name}` : 'Plantilla' }
}

export default async function PlayersPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; edit?: string; q?: string; sort?: string; pos?: string }>
}) {
  const { id: teamId } = await params
  const supabase = await createClient()
  const { data: team } = await supabase.from('teams').select('*').eq('id', teamId).single()
  if (!team) notFound()

  const terms = getTeamTerms(team.gender)
  const POSITIONS = terms.positions

  const { data: players } = await supabase
    .from('players').select('*, yellow_card_cycles_served')
    .eq('team_id', teamId)
    .order('number', { ascending: true, nullsFirst: false })

  const sp        = await searchParams
  const editingId = sp.edit ?? null
  const searchQ   = sp.q?.toLowerCase() ?? ''
  const sortBy    = sp.sort ?? 'dorsal'
  const filterPos = sp.pos ?? ''

  const allActive   = players?.filter(p =>  p.active) ?? []
  const allInactive = players?.filter(p => !p.active) ?? []

  // Stats completas por jugadora (participación + goles + tarjetas)
  const playerIds = players?.map(p => p.id) ?? []
  type PStat = { games: number; goals: number; assists: number; yellowCards: number; redCards: number }
  const statsMap: Record<string, PStat> = {}
  if (playerIds.length > 0) {
    const { data: appData } = await supabase
      .from('appearances')
      .select('player_id, goals, assists, yellow_cards, red_cards, minutes')
      .in('player_id', playerIds)
    appData?.forEach(a => {
      if (!statsMap[a.player_id]) statsMap[a.player_id] = { games: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 }
      if ((a.minutes ?? 0) > 0) statsMap[a.player_id].games++
      statsMap[a.player_id].goals       += a.goals ?? 0
      statsMap[a.player_id].assists     += a.assists ?? 0
      statsMap[a.player_id].yellowCards += a.yellow_cards ?? 0
      statsMap[a.player_id].redCards    += a.red_cards ?? 0
    })
  }
  const maxGames = Math.max(1, ...Object.values(statsMap).map(s => s.games))

  const sortedActive = [...allActive].sort((a, b) => {
    const sa = statsMap[a.id] ?? { games: 0, goals: 0, assists: 0 }
    const sb = statsMap[b.id] ?? { games: 0, goals: 0, assists: 0 }
    if (sortBy === 'goals')   return sb.goals - sa.goals || sb.assists - sa.assists
    if (sortBy === 'assists') return sb.assists - sa.assists || sb.goals - sa.goals
    if (sortBy === 'games')   return sb.games - sa.games
    return (a.number ?? 99) - (b.number ?? 99)
  })

  const filterFn = (p: typeof sortedActive[0]) => {
    if (searchQ && !p.name.toLowerCase().includes(searchQ) && !String(p.number ?? '').includes(searchQ)) return false
    if (filterPos && p.position !== filterPos) return false
    return true
  }
  const active   = sortedActive.filter(filterFn)
  const inactive = allInactive.filter(filterFn)

  // Posiciones presentes en la plantilla (para mostrar solo las relevantes)
  const presentPositions = [...new Set(allActive.map(p => p.position).filter(Boolean))] as string[]

  return (
    <PageTransition>
      <main className="max-w-7xl mx-auto px-4 md:px-10 py-8 pb-32 md:pb-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-[32px] font-extrabold leading-10 tracking-tight" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--tx)' }}>
              Plantilla
            </h2>
            <p className="flex items-center gap-2 mt-1" style={{ color: 'var(--tx-2)' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
              {searchQ
                ? `${active.length} resultado${active.length !== 1 ? 's' : ''} para "${sp.q}"`
                : `${allActive.length} ${allActive.length !== 1 ? terms.pp : terms.p} ${allActive.length !== 1 ? terms.actives : terms.active} en el sistema`
              }
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Buscador */}
            <form method="get" action={`/dashboard/team/${teamId}/players`}
              className="flex items-center gap-2 rounded-xl border px-3 py-2 focus-within:border-[var(--accent)] transition-colors"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--tx-2)', fontSize: 18 }}>search</span>
              <input
                name="q"
                type="text"
                placeholder="Buscar jugadora..."
                defaultValue={sp.q ?? ''}
                className="bg-transparent border-none outline-none text-sm w-36"
                style={{ color: 'var(--tx)' }}
              />
              {sp.q && (
                <Link href={`/dashboard/team/${teamId}/players`} style={{ color: 'var(--tx-2)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </Link>
              )}
            </form>
            <DownloadPlayersCsv
              teamName={team.name}
              players={allActive.map(p => {
                const s = statsMap[p.id] ?? { games: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 }
                return { name: p.name, number: p.number, position: p.position, ...s }
              })}
            />
            <Link
              href={`/dashboard/team/${teamId}/settings`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors hover:bg-[var(--bg-elevated)]"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)', color: 'var(--tx)' }}
            >
              <span className="material-symbols-outlined text-lg">settings</span>
              Ajustes
            </Link>
            <Link
              href={`/dashboard/team/${teamId}/seasons`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#72e697', color: '#07140c' }}
            >
              <span className="material-symbols-outlined text-lg">calendar_today</span>
              Temporadas
            </Link>
          </div>
        </div>

        {/* Formulario rápido */}
        <section
          className="mb-8 p-6 rounded-2xl border transition-all duration-200 hover:border-[var(--accent)] hover:shadow-[0_0_12px_rgba(34,197,94,0.1)]"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined" style={{ color: 'var(--accent)' }}>add_circle</span>
            <h3 className="text-[20px] font-semibold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--tx)' }}>Rápido Registro</h3>
          </div>
          <form action={addPlayer} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <input type="hidden" name="team_id" value={teamId} />
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-2)' }}>Nombre Completo</label>
              <input name="name" type="text" required placeholder={terms.p === 'jugador' ? 'Ej: Carlos García' : 'Ej: María García'}
                className="border rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-[var(--accent)]"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bdr-strong)', color: 'var(--tx)' }} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-2)' }}>Dorsal</label>
              <input name="number" type="number" min="1" max="99" placeholder="10"
                className="border rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-[var(--accent)]"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bdr-strong)', color: 'var(--tx)' }} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-2)' }}>Posición</label>
              <select name="position"
                className="border rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-[var(--accent)] appearance-none"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bdr-strong)', color: 'var(--tx)' }}>
                <option value="">Sin posición</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit"
                className="w-full h-[50px] rounded-xl flex items-center justify-center gap-2 text-sm font-bold active:scale-95 transition-transform cursor-pointer"
                style={{ backgroundColor: '#72e697', color: '#07140c' }}>
                Confirmar {terms.p.charAt(0).toUpperCase() + terms.p.slice(1)}
              </button>
            </div>
          </form>
          {sp.error && <p className="mt-3 text-sm" style={{ color: '#ffb4ab' }}>{sp.error}</p>}
        </section>

        {/* Grid de jugadores/as activos/as */}
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
            <h3 className="text-[20px] font-semibold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--tx)' }}>
              {terms.pp.charAt(0).toUpperCase() + terms.pp.slice(1)} {terms.actives.charAt(0).toUpperCase() + terms.actives.slice(1)}
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider mr-1" style={{ color: 'var(--tx-3)' }}>Ordenar</span>
              {([
                { key: 'dorsal', label: 'Dorsal' },
                { key: 'goals', label: 'Goles' },
                { key: 'assists', label: 'Asist.' },
                { key: 'games', label: 'PJ' },
              ] as const).map(opt => {
                const isActive = sortBy === opt.key
                const href = `/dashboard/team/${teamId}/players?${sp.q ? `q=${encodeURIComponent(sp.q)}&` : ''}sort=${opt.key}`
                return (
                  <Link key={opt.key} href={href}
                    className="px-3 py-1 rounded-full text-[10px] font-bold uppercase border transition-colors"
                    style={isActive
                      ? { backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent)' }
                      : { backgroundColor: 'transparent', color: 'var(--tx-3)', borderColor: 'var(--bdr-strong)' }
                    }>
                    {opt.label}
                  </Link>
                )
              })}
            </div>
            {/* Filtro por posición */}
            {presentPositions.length >= 2 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider mr-1" style={{ color: 'var(--tx-3)' }}>Posición</span>
                <Link href={`/dashboard/team/${teamId}/players?${sp.q ? `q=${encodeURIComponent(sp.q)}&` : ''}${sp.sort ? `sort=${sp.sort}&` : ''}` }
                  className="px-3 py-1 rounded-full text-[10px] font-bold uppercase border transition-colors"
                  style={!filterPos
                    ? { backgroundColor: 'rgba(96,165,250,0.15)', color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)' }
                    : { backgroundColor: 'transparent', color: 'var(--tx-3)', borderColor: 'var(--bdr-strong)' }
                  }>Todas</Link>
                {presentPositions.map(pos => {
                  const isActive = filterPos === pos
                  const href = `/dashboard/team/${teamId}/players?${sp.q ? `q=${encodeURIComponent(sp.q)}&` : ''}${sp.sort ? `sort=${sp.sort}&` : ''}pos=${encodeURIComponent(pos)}`
                  return (
                    <Link key={pos} href={href}
                      className="px-3 py-1 rounded-full text-[10px] font-bold uppercase border transition-colors"
                      style={isActive
                        ? { backgroundColor: 'rgba(96,165,250,0.15)', color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)' }
                        : { backgroundColor: 'transparent', color: 'var(--tx-3)', borderColor: 'var(--bdr-strong)' }
                      }>{pos}</Link>
                  )
                })}
              </div>
            )}
          </div>

          {active.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed py-16 text-center" style={{ borderColor: 'var(--bdr-strong)' }}>
              <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: 'var(--bdr-strong)' }}>{searchQ || filterPos ? 'search_off' : 'group_add'}</span>
              <p className="text-sm" style={{ color: 'var(--tx-2)' }}>
                {searchQ || filterPos
                  ? `Sin resultados${searchQ ? ` para "${sp.q}"` : ''}${filterPos ? ` en ${filterPos}` : ''}`
                  : `Añade la primera ${terms.p} usando el formulario de arriba`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {active.map(player => {
                const badge = player.position ? terms.posBadge(player.position) : null
                const stat  = statsMap[player.id] ?? { games: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 }
                const participationPct = Math.round((stat.games / maxGames) * 100)
                const cyclesServed = (player as { yellow_card_cycles_served?: number }).yellow_card_cycles_served ?? 0
                const effectiveYellow = stat.yellowCards - cyclesServed * 4
                const warnYellow = effectiveYellow >= 4

                if (editingId === player.id) {
                  return (
                    <div key={player.id} className="col-span-1 sm:col-span-2 lg:col-span-4 rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--accent)' }}>
                      <form action={updatePlayer} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input type="hidden" name="player_id" value={player.id} />
                        <input type="hidden" name="team_id" value={teamId} />
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-2)' }}>Nombre</label>
                          <input name="name" type="text" required defaultValue={player.name}
                            className="border rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--accent)', color: 'var(--tx)' }} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-2)' }}>Dorsal</label>
                          <input name="number" type="number" min="1" max="99" defaultValue={player.number ?? ''}
                            className="border rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bdr-strong)', color: 'var(--tx)' }} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-2)' }}>Posición</label>
                          <select name="position" defaultValue={player.position ?? ''}
                            className="border rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bdr-strong)', color: 'var(--tx)' }}>
                            <option value="">Sin posición</option>
                            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div className="flex items-end gap-2">
                          <button type="submit" className="flex-1 h-[50px] rounded-xl flex items-center justify-center gap-1 text-sm font-bold cursor-pointer" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span> Guardar
                          </button>
                          <Link href={`/dashboard/team/${teamId}/players`} className="h-[50px] w-12 rounded-xl flex items-center justify-center border transition-colors hover:bg-[var(--bg-elevated)]" style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                          </Link>
                        </div>
                        <div className="md:col-span-4 flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-2)' }}>Descripción</label>
                          <textarea
                            name="bio"
                            rows={2}
                            defaultValue={player.bio ?? ''}
                            placeholder="Breve descripción de esta jugadora: su perfil, sus puntos fuertes..."
                            className="border rounded-xl px-4 py-3 text-sm outline-none resize-none focus:border-[var(--accent)]"
                            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bdr-strong)', color: 'var(--tx)' }}
                          />
                        </div>
                      </form>
                    </div>
                  )
                }

                return (
                  <div key={player.id}
                    className="relative group overflow-hidden rounded-2xl border p-6 flex flex-col items-center transition-all duration-200 hover:border-[var(--accent)] hover:shadow-[0_0_12px_rgba(34,197,94,0.1)]"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}
                  >
                    {/* Dorsal fantasma de fondo */}
                    {player.number !== null && (
                      <span className="absolute top-0 right-2 pointer-events-none select-none"
                        style={{ fontSize: 84, fontWeight: 900, fontFamily: 'Sora, sans-serif', color: 'var(--tx)', opacity: 0.04, lineHeight: 1 }}>
                        {player.number}
                      </span>
                    )}
                    {/* Acciones hover */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Link
                        href={`/dashboard/team/${teamId}/players?edit=${player.id}`}
                        className="w-8 h-8 rounded-full flex items-center justify-center border transition-colors cursor-pointer hover:text-[var(--accent)]"
                        style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      </Link>
                      <form action={togglePlayerActive}>
                        <input type="hidden" name="player_id" value={player.id} />
                        <input type="hidden" name="team_id" value={teamId} />
                        <input type="hidden" name="active" value="true" />
                        <button type="submit"
                          className="w-8 h-8 rounded-full flex items-center justify-center border transition-colors cursor-pointer hover:text-[#ffb4ab]"
                          style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>block</span>
                        </button>
                      </form>
                    </div>

                    {/* Foto con dorsal */}
                    <div className="relative mb-4">
                      <PlayerPhotoUpload
                        playerId={player.id}
                        currentUrl={player.photo_url}
                        playerName={player.name}
                        circular
                        style={{ borderColor: 'var(--accent)', filter: 'drop-shadow(0 0 8px rgba(34,197,94,0.3))' }}
                      />
                      {player.number !== null && (
                        <span
                          className="absolute bottom-0 right-0 w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center border-2"
                          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)', borderColor: 'var(--bg-base)', fontFamily: 'Sora, sans-serif' }}
                        >
                          {player.number}
                        </span>
                      )}
                    </div>

                    {/* Nombre */}
                    <Link
                      href={`/dashboard/team/${teamId}/players/${player.id}`}
                      className="text-[20px] font-semibold mb-1 text-center transition-colors hover:text-[var(--accent)]"
                      style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}
                    >
                      {player.name}
                    </Link>

                    {/* Badge de posición */}
                    {badge ? (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase border mb-4"
                        style={{ backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }}>
                        {terms.posLabel(player.position)}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase border mb-4"
                        style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--tx-2)', borderColor: 'var(--bdr-strong)' }}>
                        Sin posición
                      </span>
                    )}

                    {/* Descripción */}
                    {player.bio && (
                      <p className="text-xs text-center line-clamp-2 mb-3 px-1 leading-relaxed" style={{ color: 'var(--tx-2)' }}>
                        {player.bio}
                      </p>
                    )}

                    {/* Alerta sanción amarillas */}
                    {warnYellow && (
                      <div className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold animate-pulse"
                        style={{ backgroundColor: 'rgba(250,204,21,0.15)', border: '1.5px solid rgba(250,204,21,0.5)', color: '#facc15' }}>
                        <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>warning</span>
                        <span>{stat.yellowCards} amarillas — <span className="uppercase tracking-wide">riesgo de sanción</span></span>
                      </div>
                    )}

                    {/* Mini stats grid */}
                    <div className="grid grid-cols-4 w-full gap-1 mb-3">
                      {([
                        { label: 'PJ', value: stat.games,       color: stat.games > 0 ? 'var(--tx-2)' : 'var(--bdr-strong)' },
                        { label: 'G',  value: stat.goals,       color: stat.goals > 0 ? 'var(--accent)' : 'var(--bdr-strong)' },
                        { label: 'A',  value: stat.assists,     color: stat.assists > 0 ? '#60a5fa' : 'var(--bdr-strong)' },
                        { label: 'AM', value: stat.yellowCards, color: stat.yellowCards >= 4 ? '#facc15' : stat.yellowCards > 0 ? 'var(--tx-2)' : 'var(--bdr-strong)' },
                      ] as { label: string; value: number; color: string }[]).map(({ label, value, color }) => (
                        <div key={label} className="rounded-lg py-1.5 text-center" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                          <span className="block text-[15px] font-bold tabular-nums leading-none" style={{ color, fontFamily: 'Sora, sans-serif' }}>{value}</span>
                          <span className="block text-[8px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--bdr-strong)' }}>{label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Barra de participación */}
                    <div className="w-full h-1 rounded-full overflow-hidden mb-1" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${participationPct}%`, backgroundColor: 'var(--accent)' }} />
                    </div>
                    <div className="flex justify-between w-full">
                      <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--tx-3)' }}>Participación</span>
                      <span className="text-[10px] font-bold" style={{ color: 'var(--accent)' }}>{participationPct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Jugadoras inactivas / bajas */}
        {inactive.length > 0 && (
          <section className="mt-12 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-semibold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--tx)' }}>
                {terms.pp.charAt(0).toUpperCase() + terms.pp.slice(1)} Inactiv{terms.actives.slice(-2)} / Bajas
              </h3>
              <span className="text-sm italic" style={{ color: 'var(--tx-2)' }}>Ocultas de la alineación principal</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inactive.map(player => (
                <div key={player.id}
                  className="flex items-center justify-between p-4 rounded-xl border"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)' }}>
                      <PlayerAvatar name={player.name} photoUrl={player.photo_url} position={player.position} size="sm" />
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: 'var(--tx)' }}>{player.name}</p>
                      <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--tx-2)' }}>
                        {player.position ?? '—'} · Baja
                      </p>
                    </div>
                  </div>
                  <form action={togglePlayerActive}>
                    <input type="hidden" name="player_id" value={player.id} />
                    <input type="hidden" name="team_id" value={teamId} />
                    <input type="hidden" name="active" value="false" />
                    <button type="submit"
                      className="text-[10px] font-bold uppercase tracking-wider hover:underline cursor-pointer transition-colors"
                      style={{ color: 'var(--accent)' }}>
                      Reactivar
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </PageTransition>
  )
}
