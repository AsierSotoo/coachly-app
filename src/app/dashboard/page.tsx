import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { AnimatedList, AnimatedItem } from '@/components/ui/animated-card'
import { PageTransition } from '@/components/ui/page-transition'
import { TeamLogo } from '@/components/team/team-logo'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: teams } = await supabase
    .from('teams')
    .select('*, seasons(id, name, created_at, matches(id, goals_for, goals_against, opponent, played_at)), players(id, active)')
    .order('created_at', { ascending: true })

  return (
    <PageTransition>
      <main className="p-4 md:p-10 min-h-[calc(100vh-64px)] pb-10">

        {/* Welcome section */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h3 className="text-[22px] md:text-[24px] font-semibold leading-8" style={{ color: '#dce1fb', fontFamily: 'Sora, sans-serif' }}>
                Resumen de la temporada
              </h3>
              <p className="text-[15px] mt-1" style={{ color: '#adb4ce' }}>
                {teams?.length
                  ? `${teams.length} equipo${teams.length !== 1 ? 's' : ''} activo${teams.length !== 1 ? 's' : ''}`
                  : 'Sin equipos registrados aún'}
              </p>
            </div>
            <Link
              href="/dashboard/team/new"
              className="flex items-center justify-center gap-2 px-6 rounded-lg text-sm font-semibold transition-transform active:scale-95 shadow-[0px_0px_12px_rgba(34,197,94,0.2)] cursor-pointer self-start sm:self-auto"
              style={{ backgroundColor: '#22c55e', color: '#003915', fontFamily: 'Sora, sans-serif', minHeight: 44 }}
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Nuevo equipo
            </Link>
          </div>
        </section>

        {!teams?.length ? (
          <div className="border-2 border-dashed border-[#2e3447]/50 rounded-[24px] p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-green-500/50 hover:bg-[#191f31]/20 transition-all min-h-[340px]">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#23293c' }}>
              <span className="material-symbols-outlined text-4xl" style={{ color: '#869585' }}>add_circle</span>
            </div>
            <p className="text-[20px] font-semibold" style={{ color: '#dce1fb', fontFamily: 'Sora, sans-serif' }}>Empieza aquí</p>
            <p className="text-sm mt-2 max-w-[200px]" style={{ color: '#adb4ce' }}>Crea tu primer equipo para registrar estadísticas</p>
            <Link href="/dashboard/team/new"
              className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95 cursor-pointer"
              style={{ backgroundColor: '#22c55e', color: '#003915' }}>
              <span className="material-symbols-outlined text-sm">add</span> Crear equipo
            </Link>
          </div>
        ) : (
          <>
            {/* Team cards grid */}
            <AnimatedList className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {teams.map((team, idx) => {
                type SeasonWithMatches = {
                  id: string; name: string; created_at: string
                  matches: { id: string; goals_for: number; goals_against: number; opponent: string; played_at: string }[]
                }
                const seasons = (team.seasons ?? []) as SeasonWithMatches[]
                // Ordenar por fecha de creación DESC para obtener la más reciente
                const lastSeason = [...seasons].sort((a, b) =>
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0]
                const matches = lastSeason?.matches ?? []
                const sorted = [...matches].sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())
                const lastMatch = sorted[0]
                const wins        = matches.filter(m => m.goals_for > m.goals_against).length
                const draws       = matches.filter(m => m.goals_for === m.goals_against).length
                const losses      = matches.filter(m => m.goals_for < m.goals_against).length
                const goalsFor    = matches.reduce((s, m) => s + m.goals_for, 0)
                const goalsAgainst = matches.reduce((s, m) => s + m.goals_against, 0)
                const playerCount = ((team.players ?? []) as { id: string; active: boolean }[]).filter(p => p.active).length
                const recentForm  = sorted.slice(0, 5).reverse()

                const lastResult = lastMatch
                  ? lastMatch.goals_for > lastMatch.goals_against ? { label: 'V', color: '#4be277' }
                    : lastMatch.goals_for < lastMatch.goals_against ? { label: 'D', color: '#ffb4ab' }
                    : { label: 'E', color: '#adb4ce' }
                  : null

                return (
                  <AnimatedItem key={team.id} delay={idx * 0.05}>
                    <div className="rounded-[24px] border border-[#1e293b] p-6 flex flex-col hover:border-green-500/50 transition-all group" style={{ backgroundColor: '#0f172a' }}>

                      {/* Header: escudo + nombre + último resultado */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4 items-center">
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-[#2e3447] p-2 group-hover:scale-105 transition-transform overflow-hidden" style={{ backgroundColor: '#191f31' }}>
                            <TeamLogo name={team.name} logoUrl={team.logo_url} size="lg" className="h-12 w-12" />
                          </div>
                          <div>
                            <h4 className="text-[20px] font-semibold leading-7" style={{ color: '#dce1fb', fontFamily: 'Sora, sans-serif' }}>{team.name}</h4>
                            <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
                              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#4be277' }}>
                                {team.category ?? team.gender ?? 'Mi equipo'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {lastMatch && lastResult && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[#2e3447]" style={{ backgroundColor: '#070d1f' }}>
                            <span className="text-[12px] font-semibold" style={{ color: lastResult.color }}>
                              {lastResult.label} {lastMatch.goals_for}-{lastMatch.goals_against}
                            </span>
                            <span className="text-[10px] ml-1 truncate max-w-[60px]" style={{ color: '#adb4ce' }}>vs {lastMatch.opponent}</span>
                          </div>
                        )}
                      </div>

                      {/* Season record */}
                      {matches.length > 0 && (
                        <div className="my-4">
                          <p className="text-[12px] font-semibold uppercase tracking-tight mb-2" style={{ color: '#adb4ce' }}>
                            {lastSeason?.name ?? 'Temporada actual'}
                          </p>
                          <div className="flex gap-2">
                            <div className="flex-1 rounded-lg p-2 text-center border border-[#22c55e]/30" style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
                              <span className="block text-[24px] font-bold leading-6 tabular-nums" style={{ color: '#4be277', fontFamily: 'Sora, sans-serif' }}>{wins}</span>
                              <span className="text-[10px] font-bold uppercase mt-1 block" style={{ color: '#4be277' }}>Victorias</span>
                            </div>
                            <div className="flex-1 rounded-lg p-2 text-center border border-[#2e3447]/30" style={{ backgroundColor: 'rgba(46,52,71,0.3)' }}>
                              <span className="block text-[24px] font-bold leading-6 tabular-nums" style={{ color: '#dce1fb', fontFamily: 'Sora, sans-serif' }}>{draws}</span>
                              <span className="text-[10px] font-bold uppercase mt-1 block" style={{ color: '#adb4ce' }}>Empates</span>
                            </div>
                            <div className="flex-1 rounded-lg p-2 text-center border border-[#ffb4ab]/20" style={{ backgroundColor: 'rgba(255,180,171,0.05)' }}>
                              <span className="block text-[24px] font-bold leading-6 tabular-nums" style={{ color: '#ffb4ab', fontFamily: 'Sora, sans-serif' }}>{losses}</span>
                              <span className="text-[10px] font-bold uppercase mt-1 block" style={{ color: '#ffb4ab' }}>Derrotas</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {matches.length > 0 && (
                        <p className="text-[11px] text-center mt-1" style={{ color: '#adb4ce' }}>
                          GF&nbsp;<span style={{ color: '#4be277' }}>{goalsFor}</span>
                          &nbsp;·&nbsp;
                          GC&nbsp;<span style={{ color: '#ffb4ab' }}>{goalsAgainst}</span>
                          &nbsp;·&nbsp;{matches.length}&nbsp;partido{matches.length !== 1 ? 's' : ''}
                        </p>
                      )}

                      {seasons.length === 0 && (
                        <Link
                          href={`/dashboard/team/${team.id}/seasons`}
                          className="my-3 flex items-center gap-2 rounded-xl border border-dashed px-4 py-3 text-xs font-semibold transition-colors hover:border-green-500/40 hover:text-green-400"
                          style={{ borderColor: '#2e3447', color: '#adb4ce' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
                          Crear primera temporada para empezar
                        </Link>
                      )}

                      {seasons.length > 0 && matches.length === 0 && (
                        <p className="my-3 text-xs text-center" style={{ color: '#adb4ce' }}>
                          Sin partidos en {lastSeason?.name}
                        </p>
                      )}

                      {/* Forma reciente */}
                      {recentForm.length > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>Forma</span>
                          <div className="flex gap-1">
                            {recentForm.map((m, i) => {
                              const res = m.goals_for > m.goals_against ? 'V' : m.goals_for < m.goals_against ? 'D' : 'E'
                              return (
                                <div key={i} className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-black"
                                  style={{
                                    backgroundColor: res === 'V' ? 'rgba(34,197,94,0.2)' : res === 'D' ? 'rgba(255,180,171,0.15)' : 'rgba(148,163,184,0.15)',
                                    color: res === 'V' ? '#4be277' : res === 'D' ? '#ffb4ab' : '#94a3b8',
                                    border: `1px solid ${res === 'V' ? 'rgba(34,197,94,0.3)' : res === 'D' ? 'rgba(255,180,171,0.3)' : 'rgba(148,163,184,0.3)'}`,
                                  }}>
                                  {res}
                                </div>
                              )
                            })}
                          </div>
                          {playerCount > 0 && (
                            <span className="ml-auto flex items-center gap-1 text-[10px]" style={{ color: '#adb4ce' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>group</span>
                              {playerCount}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Acciones */}
                      <div className="mt-auto pt-4 flex gap-3">
                        <Link
                          href={`/dashboard/team/${team.id}/players`}
                          className="flex-1 flex items-center justify-center rounded-lg text-[13px] font-semibold transition-all active:scale-95 cursor-pointer hover:brightness-110"
                          style={{ backgroundColor: '#22c55e', color: '#003915', fontFamily: 'Sora, sans-serif', minHeight: 44 }}
                        >
                          Plantilla
                        </Link>
                        <Link
                          href={seasons.length === 1 ? `/dashboard/season/${seasons[0].id}` : `/dashboard/team/${team.id}/seasons`}
                          className="flex-1 flex items-center justify-center rounded-lg text-[13px] font-semibold border transition-all active:scale-95 cursor-pointer hover:bg-[#2e3447]/30"
                          style={{ borderColor: '#2e3447', color: '#dce1fb', fontFamily: 'Sora, sans-serif', minHeight: 44 }}
                        >
                          Temporada
                        </Link>
                      </div>
                    </div>
                  </AnimatedItem>
                )
              })}

              {/* Add team placeholder */}
              <AnimatedItem delay={teams.length * 0.05}>
                <Link
                  href="/dashboard/team/new"
                  className="border-2 border-dashed border-[#2e3447]/50 rounded-[24px] p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-green-500/50 hover:bg-[#191f31]/20 transition-all group min-h-[200px]"
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#22c55e]/10 transition-colors" style={{ backgroundColor: '#23293c' }}>
                    <span className="material-symbols-outlined text-4xl group-hover:text-green-400 transition-colors" style={{ color: '#869585' }}>add_circle</span>
                  </div>
                  <p className="text-[20px] font-semibold" style={{ color: '#dce1fb', fontFamily: 'Sora, sans-serif' }}>Nuevo equipo</p>
                  <p className="text-sm mt-2 max-w-[200px]" style={{ color: '#adb4ce' }}>Añade otro equipo para gestionar sus estadísticas</p>
                </Link>
              </AnimatedItem>
            </AnimatedList>
          </>
        )}
      </main>
    </PageTransition>
  )
}
