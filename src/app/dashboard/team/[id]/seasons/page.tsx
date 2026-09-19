import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createSeason } from '../../actions'
import Link from 'next/link'
import { PageTransition } from '@/components/ui/page-transition'
import { TeamLogo } from '@/components/team/team-logo'
import { DeleteSeasonButton } from '@/components/season/delete-season-button'

export default async function SeasonsPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id: teamId } = await params
  const supabase = await createClient()
  const { data: team } = await supabase.from('teams').select('*').eq('id', teamId).single()
  if (!team) notFound()

  const { data: seasons } = await supabase
    .from('seasons').select('*, matches(id, goals_for, goals_against, status)').eq('team_id', teamId).order('created_at', { ascending: false })

  const sp = await searchParams

  return (
    <PageTransition>
      <main className="max-w-3xl mx-auto px-4 md:px-10 py-8 pb-32 md:pb-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center border overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)' }}>
              <TeamLogo name={team.name} logoUrl={team.logo_url} size="lg" />
            </div>
            <div>
              <Link href="/dashboard" className="text-xs hover:underline mb-1 block" style={{ color: 'var(--tx-2)' }}>
                ← Mis equipos
              </Link>
              <h1 className="text-[24px] font-extrabold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--tx)' }}>
                {team.name}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--tx-2)' }}>
                {seasons?.length ?? 0} temporada{(seasons?.length ?? 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Nueva temporada */}
        <section className="mb-8 rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}>
          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--bdr-strong)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 18 }}>add_circle</span>
            <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--tx-2)' }}>Nueva temporada</h2>
          </div>
          <form action={createSeason} className="flex gap-3 p-5">
            <input type="hidden" name="team_id" value={teamId} />
            <input
              name="name" type="text" required
              placeholder="ej. 2025/26"
              className="flex-1 rounded-xl px-4 text-sm focus:outline-none placeholder:text-slate-600 focus:border-[var(--accent)]"
              style={{ minHeight: 44, backgroundColor: 'var(--bg-input)', border: '1px solid var(--bdr-strong)', color: 'var(--tx)' }}
            />
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl px-5 text-sm font-bold active:scale-95 transition-all cursor-pointer flex-shrink-0"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)', minHeight: 44, boxShadow: '0 0 12px rgba(34,197,94,0.2)' }}
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Crear
            </button>
          </form>
          {sp.error && <p className="px-5 pb-4 text-sm" style={{ color: '#ffb4ab' }}>{sp.error}</p>}
        </section>

        {/* Lista de temporadas */}
        {!seasons?.length ? (
          <div className="rounded-2xl border-2 border-dashed py-16 text-center" style={{ borderColor: 'var(--bdr-strong)' }}>
            <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: 'var(--bdr-strong)' }}>calendar_today</span>
            <p className="text-sm" style={{ color: 'var(--tx-2)' }}>Crea la primera temporada para empezar.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {seasons.map((season) => {
              const allSeasonMatches = season.matches as { id: string; goals_for: number; goals_against: number; status?: string }[]
              const matches    = allSeasonMatches?.filter(m => m.status !== 'scheduled') ?? []
              const total      = matches.length
              const wins       = matches.filter(m => m.goals_for > m.goals_against).length
              const draws      = matches.filter(m => m.goals_for === m.goals_against).length
              const losses     = matches.filter(m => m.goals_for < m.goals_against).length
              const goalsFor   = matches.reduce((s, m) => s + m.goals_for, 0)
              const goalsAgainst = matches.reduce((s, m) => s + m.goals_against, 0)
              const diff       = goalsFor - goalsAgainst

              return (
                <div
                  key={season.id}
                  className="group relative overflow-hidden rounded-2xl border transition-all hover:border-[var(--accent)]/30 hover:shadow-lg"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />

                  <Link href={`/dashboard/season/${season.id}`} className="block p-5 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                          style={{ backgroundColor: 'var(--accent-subtle)', borderColor: 'var(--accent)' }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 18 }}>calendar_today</span>
                        </div>
                        <div>
                          <p className="text-base font-bold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--tx)' }}>
                            {season.name}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--tx-2)' }}>
                            {total} partido{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined transition-transform group-hover:translate-x-0.5"
                        style={{ color: 'var(--bdr-strong)', fontSize: 20 }}>chevron_right</span>
                    </div>

                    {total > 0 ? (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'Victorias', value: wins,   color: '#72e697',  bg: 'rgba(75,226,119,0.08)',    border: 'rgba(75,226,119,0.2)' },
                            { label: 'Empates',   value: draws,  color: '#fbbf24',  bg: 'rgba(251,191,36,0.07)',    border: 'rgba(251,191,36,0.2)' },
                            { label: 'Derrotas',  value: losses, color: '#f87171',  bg: 'rgba(248,113,113,0.05)',   border: 'rgba(248,113,113,0.2)' },
                          ].map(({ label, value, color, bg, border }) => (
                            <div key={label} className="flex items-center justify-center gap-2 rounded-xl border py-2.5"
                              style={{ backgroundColor: bg, borderColor: border }}>
                              <span className="text-xl font-extrabold" style={{ color, fontFamily: 'Sora, sans-serif' }}>{value}</span>
                              <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--tx-2)' }}>{label}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-center mt-2" style={{ color: 'var(--tx-2)' }}>
                          GF&nbsp;<span style={{ color: '#72e697' }}>{goalsFor}</span>
                          &nbsp;·&nbsp;
                          GC&nbsp;<span style={{ color: '#ffb4ab' }}>{goalsAgainst}</span>
                          &nbsp;·&nbsp;
                          <span style={{ color: diff > 0 ? '#72e697' : diff < 0 ? '#ffb4ab' : 'var(--tx-2)' }}>
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        </p>
                        <p className="text-[10px] text-center mt-0.5" style={{ color: 'var(--tx-3)' }}>
                          {allSeasonMatches.length - total > 0 ? `${allSeasonMatches.length - total} pendiente${allSeasonMatches.length - total !== 1 ? 's' : ''}` : ''}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-center py-1" style={{ color: 'var(--bdr-strong)' }}>Sin partidos registrados aún</p>
                    )}
                  </Link>

                  <div className="flex items-center justify-between px-5 pb-4">
                    {total > 0 ? (
                      <Link
                        href={`/dashboard/season/${season.id}/stats`}
                        className="flex items-center gap-1.5 text-xs font-bold transition-colors hover:underline"
                        style={{ color: 'var(--tx-2)' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--accent)' }}>leaderboard</span>
                        Ver estadísticas
                      </Link>
                    ) : (
                      <Link
                        href={`/dashboard/season/${season.id}?new=1`}
                        className="flex items-center gap-1.5 text-xs font-bold transition-colors"
                        style={{ color: 'var(--accent)' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add_circle</span>
                        Registrar primer partido
                      </Link>
                    )}
                    <DeleteSeasonButton seasonId={season.id} teamId={teamId} matchCount={total} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </PageTransition>
  )
}
