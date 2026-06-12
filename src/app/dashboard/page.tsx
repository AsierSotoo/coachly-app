import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Users, Calendar, Settings, Plus, Trophy } from 'lucide-react'
import { AnimatedList, AnimatedItem } from '@/components/ui/animated-card'
import { PageTransition } from '@/components/ui/page-transition'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-white">Mis equipos</h1>
            <p className="text-xs text-slate-500 mt-0.5">{teams?.length ?? 0} equipo{(teams?.length ?? 0) !== 1 ? 's' : ''} registrado{(teams?.length ?? 0) !== 1 ? 's' : ''}</p>
          </div>
          <Link
            href="/dashboard/team/new"
            className="flex items-center gap-1.5 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-400 hover:shadow-lg hover:shadow-green-500/20 active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo equipo
          </Link>
        </div>

        {!teams?.length ? (
          <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-16 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800">
              <Trophy className="h-7 w-7 text-slate-500" />
            </div>
            <p className="text-slate-400">Aún no tienes ningún equipo.</p>
            <Link href="/dashboard/team/new" className="mt-3 inline-block text-sm font-medium text-green-400 hover:text-green-300 transition-colors">
              Crea tu primer equipo →
            </Link>
          </div>
        ) : (
          <AnimatedList>
            {teams.map(team => (
              <AnimatedItem key={team.id}>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 transition-all hover:border-slate-600 hover:shadow-xl hover:shadow-black/40 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/20 group-hover:bg-green-500/20 transition-colors">
                        <Trophy className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{team.name}</p>
                        <p className="text-xs text-slate-500">
                          {[team.gender, team.category].filter(Boolean).join(' · ') || 'Sin categoría'}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/team/${team.id}/settings`}
                      className="rounded-lg p-2 text-slate-600 hover:bg-slate-800 hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      <Settings className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="flex gap-2 border-t border-slate-800 pt-3">
                    <Link
                      href={`/dashboard/team/${team.id}/players`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-2.5 text-xs font-medium text-slate-300 transition-all hover:bg-slate-700 hover:text-white cursor-pointer"
                    >
                      <Users className="h-3.5 w-3.5" />
                      Plantilla
                    </Link>
                    <Link
                      href={`/dashboard/team/${team.id}/seasons`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-2.5 text-xs font-medium text-slate-300 transition-all hover:bg-slate-700 hover:text-white cursor-pointer"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Temporadas
                    </Link>
                  </div>
                </div>
              </AnimatedItem>
            ))}
          </AnimatedList>
        )}
      </main>
    </PageTransition>
  )
}
