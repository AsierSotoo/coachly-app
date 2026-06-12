import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { addPlayer, togglePlayerActive, updatePlayer } from '../../actions'
import Link from 'next/link'
import { PageTransition } from '@/components/ui/page-transition'
import { AnimatedList, AnimatedItem } from '@/components/ui/animated-card'
import { ChevronLeft, Settings, UserPlus } from 'lucide-react'

const POSITIONS = ['Portera', 'Defensa', 'Centrocampista', 'Delantera']

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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href="/dashboard" className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <ChevronLeft className="h-3 w-3" /> Dashboard
          </Link>
          <h1 className="mt-2 font-[family-name:var(--font-heading)] text-xl font-bold text-white">{team.name}</h1>
          <p className="text-xs text-slate-500">{[team.gender, team.category].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="flex gap-2 mt-1">
          <Link href={`/dashboard/team/${teamId}/settings`} className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer">
            <Settings className="h-3 w-3" /> Ajustes
          </Link>
          <Link href={`/dashboard/team/${teamId}/seasons`} className="rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 transition-colors cursor-pointer">Temporadas →</Link>
        </div>
      </div>

      {/* Añadir */}
      <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400">Añadir jugadora</h2>
        <form action={addPlayer} className="flex flex-col gap-3">
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
            <button type="submit" className="rounded-lg bg-green-500 px-5 h-11 text-sm font-semibold text-white hover:bg-green-400 transition-colors cursor-pointer">
              Añadir
            </button>
          </div>
          {sp.error && <p className="text-sm text-red-400">{sp.error}</p>}
        </form>
      </section>

      {/* Jugadoras activas */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
          Plantilla · {active.length} jugadoras
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-slate-600 py-4 text-center">Añade la primera jugadora arriba.</p>
        ) : (
          <AnimatedList>
            {active.map(player => (
              <AnimatedItem key={player.id} className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden hover:border-slate-700 transition-colors">
                {editingId === player.id ? (
                  <form action={updatePlayer} className="p-4 flex flex-col gap-3">
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
                      <button type="submit" className="rounded-lg bg-green-500 px-4 h-11 text-sm font-semibold text-white hover:bg-green-400 cursor-pointer">Guardar</button>
                      <Link href={`/dashboard/team/${teamId}/players`} className="rounded-lg border border-slate-700 px-4 h-11 flex items-center text-sm text-slate-400 hover:bg-slate-800 cursor-pointer">✕</Link>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 font-[family-name:var(--font-heading)] text-sm font-bold text-green-400">
                        {player.number ?? '?'}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">{player.name}</p>
                        <p className="text-xs text-slate-500">{player.position ?? 'Sin posición'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link href={`/dashboard/team/${teamId}/players?edit=${player.id}`} className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">Editar</Link>
                      <form action={togglePlayerActive}>
                        <input type="hidden" name="player_id" value={player.id} />
                        <input type="hidden" name="team_id" value={teamId} />
                        <input type="hidden" name="active" value="true" />
                        <button type="submit" className="text-xs text-slate-600 hover:text-red-400 transition-colors cursor-pointer">Baja</button>
                      </form>
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
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-600">Bajas · {inactive.length}</h2>
          <div className="flex flex-col gap-2">
            {inactive.map(player => (
              <div key={player.id} className="flex items-center justify-between rounded-xl border border-slate-800/50 px-4 py-3 opacity-50">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 font-[family-name:var(--font-heading)] text-sm font-bold text-slate-600">
                    {player.number ?? '?'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-500 line-through">{player.name}</p>
                    <p className="text-xs text-slate-600">{player.position ?? '—'}</p>
                  </div>
                </div>
                <form action={togglePlayerActive}>
                  <input type="hidden" name="player_id" value={player.id} />
                  <input type="hidden" name="team_id" value={teamId} />
                  <input type="hidden" name="active" value="false" />
                  <button type="submit" className="text-xs text-slate-600 hover:text-green-400 transition-colors cursor-pointer">Reactivar</button>
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
