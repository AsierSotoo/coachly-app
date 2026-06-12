import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Users, Calendar, Settings, Plus, ChevronRight } from 'lucide-react'
import { AnimatedList, AnimatedItem } from '@/components/ui/animated-card'
import { PageTransition } from '@/components/ui/page-transition'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: teams } = await supabase
    .from('teams')
    .select('*, seasons(id, name)')
    .order('created_at', { ascending: true })

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-2xl px-4 py-6">

        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-green-400/70 mb-1">Panel de control</p>
            <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white">Mis equipos</h1>
          </div>
          <Link
            href="/dashboard/team/new"
            className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-500/20 transition-all hover:bg-green-400 hover:shadow-green-500/30 active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
        </div>

        {!teams?.length ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-20 text-center backdrop-blur">
            <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800">
              <Users className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-base font-medium text-slate-400">Aún no tienes ningún equipo</p>
            <p className="mt-1 text-sm text-slate-600">Crea tu primer equipo para empezar a registrar estadísticas</p>
            <Link
              href="/dashboard/team/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-500/20 hover:bg-green-400 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Crear equipo
            </Link>
          </div>
        ) : (
          <AnimatedList>
            {teams.map((team, idx) => (
              <AnimatedItem key={team.id} delay={idx * 0.05}>
                <div className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 transition-all duration-300 hover:border-slate-600 hover:shadow-2xl hover:shadow-black/50">

                  {/* Gradiente superior */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />

                  {/* Glow on hover */}
                  <div className="absolute -inset-1 rounded-3xl bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative p-5">
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-3">
                        {/* Avatar del equipo */}
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-700 shadow-lg shadow-green-500/20">
                          <span className="font-[family-name:var(--font-heading)] text-lg font-black text-white">
                            {team.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h2 className="font-[family-name:var(--font-heading)] text-base font-bold text-white leading-tight">
                            {team.name}
                          </h2>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {team.gender && (
                              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                                {team.gender}
                              </span>
                            )}
                            {team.category && (
                              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                                {team.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/team/${team.id}/settings`}
                        className="rounded-xl p-2 text-slate-600 hover:bg-slate-800 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        <Settings className="h-4 w-4" />
                      </Link>
                    </div>

                    {/* Temporadas */}
                    {team.seasons && team.seasons.length > 0 && (
                      <div className="mb-4 flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-600" />
                        <span className="text-xs text-slate-500">
                          {team.seasons.length} temporada{team.seasons.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-slate-700">·</span>
                        <span className="text-xs text-slate-500">
                          Última: {(team.seasons as { name: string }[]).at(-1)?.name ?? '—'}
                        </span>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/dashboard/team/${team.id}/players`}
                        className="flex items-center justify-between rounded-2xl bg-slate-800/80 px-4 py-3 transition-all hover:bg-slate-700/80 cursor-pointer group/btn"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-300">Plantilla</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover/btn:text-slate-400 transition-colors" />
                      </Link>
                      <Link
                        href={`/dashboard/team/${team.id}/seasons`}
                        className="flex items-center justify-between rounded-2xl bg-green-500/10 border border-green-500/20 px-4 py-3 transition-all hover:bg-green-500/20 cursor-pointer group/btn"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-green-400" />
                          <span className="text-sm font-medium text-green-300">Temporadas</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-green-600 group-hover/btn:text-green-400 transition-colors" />
                      </Link>
                    </div>
                  </div>

                  {/* Bottom gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
                </div>
              </AnimatedItem>
            ))}
          </AnimatedList>
        )}
      </main>
    </PageTransition>
  )
}
