import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { addPlayer, togglePlayerActive, updatePlayer } from '../../actions'
import Link from 'next/link'
import { PageTransition } from '@/components/ui/page-transition'
import { AnimatedList, AnimatedItem } from '@/components/ui/animated-card'
import { ChevronLeft, Settings, Plus, UserMinus, UserCheck, Pencil, X, Check } from 'lucide-react'
import { TeamLogo } from '@/components/team/team-logo'
import { PlayerPhotoUpload } from '@/components/team/player-photo-upload'
import { PlayerAvatar } from '@/components/team/player-avatar'

const POSITIONS = ['Portera', 'Defensa', 'Centrocampista', 'Delantera']
const POSITION_BADGES: Record<string, string> = {
  Portera: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Defensa: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Centrocampista: 'bg-green-500/15 text-green-400 border-green-500/30',
  Delantera: 'bg-red-500/15 text-red-400 border-red-500/30',
}

export default async function PlayersPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; edit?: string }>
}) {
  const { id: teamId } = await params
  const supabase = await createClient()
  const { data: team } = await supabase.from('teams').select('*').eq('id', teamId).single()
  if (!team) notFound()

  const { data: players } = await supabase
    .from('players').select('*').eq('team_id', teamId)
    .order('number', { ascending: true, nullsFirst: false })

  const active = players?.filter(p => p.active) ?? []
  const inactive = players?.filter(p => !p.active) ?? []
  const sp = await searchParams
  const editingId = sp.edit ?? null

  return (
    <PageTransition>
      <main className="mx-auto max-w-2xl px-4 py-6">

        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard" className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <ChevronLeft className="h-3 w-3" /> Dashboard
          </Link>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TeamLogo name={team.name} logoUrl={team.logo_url} size="lg" />
              <div>
                <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-white">{team.name}</h1>
                <p className="text-xs text-slate-500">{[team.gender, team.category].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/team/${teamId}/settings`} className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer">
                <Settings className="h-3.5 w-3.5" /> Ajustes
              </Link>
              <Link href={`/dashboard/team/${teamId}/seasons`} className="flex items-center gap-1.5 rounded-xl bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs font-bold text-green-400 hover:bg-green-500/20 transition-colors cursor-pointer">
                Temporadas →
              </Link>
            </div>
          </div>
        </div>

        {/* Añadir jugadora */}
        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur">
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
            <Plus className="h-3.5 w-3.5 text-green-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Añadir jugadora</h2>
          </div>
          <form action={addPlayer} className="p-4 flex flex-col gap-3">
            <input type="hidden" name="team_id" value={teamId} />
            <div className="flex gap-2">
              <input name="number" type="number" min="1" max="99" placeholder="Nº" className="w-16 h-11 px-3 text-sm text-center" />
              <input name="name" type="text" required placeholder="Nombre completo" className="flex-1 h-11 px-3 text-sm" />
            </div>
            <div className="flex gap-2">
              <select name="position" className="flex-1 h-11 px-3 text-sm">
                <option value="">Posición (opcional)</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button type="submit" className="flex items-center gap-1.5 rounded-xl bg-green-500 px-5 h-11 text-sm font-bold text-white hover:bg-green-400 active:scale-95 transition-all cursor-pointer shadow-lg shadow-green-500/20">
                <Plus className="h-4 w-4" /> Añadir
              </button>
            </div>
            {sp.error && <p className="text-sm text-red-400">{sp.error}</p>}
          </form>
        </div>

        {/* Plantilla activa */}
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Plantilla
            </h2>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-400">
              {active.length}
            </span>
          </div>

          {active.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 py-10 text-center">
              <p className="text-sm text-slate-500">Añade la primera jugadora arriba.</p>
            </div>
          ) : (
            <AnimatedList>
              {active.map(player => (
                <AnimatedItem key={player.id}>
                  {editingId === player.id ? (
                    /* Formulario de edición */
                    <div className="rounded-2xl border border-green-500/30 bg-slate-900 p-4">
                      <form action={updatePlayer} className="flex flex-col gap-3">
                        <input type="hidden" name="player_id" value={player.id} />
                        <input type="hidden" name="team_id" value={teamId} />
                        <div className="flex gap-2">
                          <input name="number" type="number" min="1" max="99" defaultValue={player.number ?? ''} placeholder="Nº" className="w-16 h-11 px-3 text-sm text-center" />
                          <input name="name" type="text" required defaultValue={player.name} className="flex-1 h-11 px-3 text-sm" />
                        </div>
                        <div className="flex gap-2">
                          <select name="position" defaultValue={player.position ?? ''} className="flex-1 h-11 px-3 text-sm">
                            <option value="">Sin posición</option>
                            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <button type="submit" className="flex items-center gap-1 rounded-xl bg-green-500 px-4 h-11 text-sm font-bold text-white hover:bg-green-400 cursor-pointer">
                            <Check className="h-4 w-4" />
                          </button>
                          <Link href={`/dashboard/team/${teamId}/players`} className="flex items-center gap-1 rounded-xl border border-slate-700 px-4 h-11 text-slate-400 hover:bg-slate-800 cursor-pointer">
                            <X className="h-4 w-4" />
                          </Link>
                        </div>
                      </form>
                    </div>
                  ) : (
                    /* Card de jugadora */
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition-all hover:border-slate-700">
                      <div className="flex items-center gap-3 p-3">
                        {/* Foto con upload inline */}
                        <PlayerPhotoUpload
                          playerId={player.id}
                          currentUrl={player.photo_url}
                          playerName={player.name}
                          size="sm"
                        />

                        {/* Dorsal */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800">
                          <span className="font-[family-name:var(--font-heading)] text-sm font-black text-green-400">
                            {player.number ?? '—'}
                          </span>
                        </div>

                        {/* Nombre y posición */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{player.name}</p>
                          {player.position ? (
                            <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide mt-0.5 ${POSITION_BADGES[player.position] ?? 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                              {player.position}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600">Sin posición</span>
                          )}
                        </div>

                        {/* Acciones — visibles en hover */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/dashboard/team/${teamId}/players?edit=${player.id}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-500 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <form action={togglePlayerActive}>
                            <input type="hidden" name="player_id" value={player.id} />
                            <input type="hidden" name="team_id" value={teamId} />
                            <input type="hidden" name="active" value="true" />
                            <button type="submit" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-500 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors cursor-pointer">
                              <UserMinus className="h-3.5 w-3.5" />
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}
                </AnimatedItem>
              ))}
            </AnimatedList>
          )}
        </section>

        {/* Bajas */}
        {inactive.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600">Bajas</h2>
              <span className="rounded-full bg-slate-800/60 px-2.5 py-0.5 text-xs text-slate-600">{inactive.length}</span>
            </div>
            <div className="flex flex-col gap-2 opacity-50">
              {inactive.map(player => (
                <div key={player.id} className="flex items-center justify-between rounded-2xl border border-slate-800/50 bg-slate-900/40 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <PlayerAvatar name={player.name} photoUrl={player.photo_url} position={player.position} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-slate-500 line-through">{player.name}</p>
                      <p className="text-xs text-slate-700">{player.position ?? '—'}</p>
                    </div>
                  </div>
                  <form action={togglePlayerActive}>
                    <input type="hidden" name="player_id" value={player.id} />
                    <input type="hidden" name="team_id" value={teamId} />
                    <input type="hidden" name="active" value="false" />
                    <button type="submit" className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-600 hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-400 transition-colors cursor-pointer">
                      <UserCheck className="h-3.5 w-3.5" /> Reactivar
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
