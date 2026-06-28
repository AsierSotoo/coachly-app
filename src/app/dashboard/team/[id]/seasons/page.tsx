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
    .from('seasons').select('*, matches(id, goals_for, goals_against)').eq('team_id', teamId).order('created_at', { ascending: false })

  const sp = await searchParams

  return (
    <PageTransition>
      <main className="max-w-3xl mx-auto px-4 md:px-10 py-8 pb-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-[#2e3447] overflow-hidden" style={{ backgroundColor: '#191f31' }}>
              <TeamLogo name={team.name} logoUrl={team.logo_url} size="lg" />
            </div>
            <div>
              <Link href="/dashboard" className="text-xs hover:underline mb-1 block" style={{ color: '#adb4ce' }}>
                ← Mis equipos
              </Link>
              <h1 className="text-[24px] font-extrabold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                {team.name}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: '#adb4ce' }}>
                {seasons?.length ?? 0} temporada{(seasons?.length ?? 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Nueva temporada */}
        <section
          className="mb-8 rounded-[24px] border border-[#1e293b] overflow-hidden"
          style={{ backgroundColor: '#0f172a' }}
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1e293b]">
            <span className="material-symbols-outlined" style={{ color: '#4be277', fontSize: 18 }}>add_circle</span>
            <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>Nueva temporada</h2>
          </div>
          <form action={createSeason} className="flex gap-3 p-5">
            <input type="hidden" name="team_id" value={teamId} />
            <input
              name="name" type="text" required
              placeholder="ej. 2025/26"
              className="flex-1"
              style={{ minHeight: 44 }}
            />
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl px-5 text-sm font-bold active:scale-95 transition-all cursor-pointer flex-shrink-0"
              style={{ backgroundColor: '#22c55e', color: '#003915', minHeight: 44, boxShadow: '0 0 12px rgba(34,197,94,0.2)' }}
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Crear
            </button>
          </form>
          {sp.error && <p className="px-5 pb-4 text-sm" style={{ color: '#ffb4ab' }}>{sp.error}</p>}
        </section>

        {/* Lista de temporadas */}
        {!seasons?.length ? (
          <div className="rounded-[24px] border-2 border-dashed border-[#2e3447]/50 py-16 text-center">
            <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: '#2e3447' }}>calendar_today</span>
            <p className="text-sm" style={{ color: '#adb4ce' }}>Crea la primera temporada para empezar.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {seasons.map((season) => {
              const matches    = season.matches as { id: string; goals_for: number; goals_against: number }[]
              const total      = matches?.length ?? 0
              const wins       = matches?.filter(m => m.goals_for > m.goals_against).length ?? 0
              const draws      = matches?.filter(m => m.goals_for === m.goals_against).length ?? 0
              const losses     = matches?.filter(m => m.goals_for < m.goals_against).length ?? 0
              const goalsFor   = matches?.reduce((s, m) => s + m.goals_for, 0) ?? 0
              const goalsAgainst = matches?.reduce((s, m) => s + m.goals_against, 0) ?? 0
              const diff       = goalsFor - goalsAgainst

              return (
                <div
                  key={season.id}
                  className="group relative overflow-hidden rounded-[24px] border border-[#1e293b] transition-all hover:border-[#22c55e]/30 hover:shadow-lg"
                  style={{ backgroundColor: '#0f172a' }}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />

                  <Link href={`/dashboard/season/${season.id}`} className="block p-5 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#22c55e]/20"
                          style={{ backgroundColor: 'rgba(34,197,94,0.08)' }}>
                          <span className="material-symbols-outlined" style={{ color: '#4be277', fontSize: 18 }}>calendar_today</span>
                        </div>
                        <div>
                          <p className="text-base font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                            {season.name}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#adb4ce' }}>
                            {total} partido{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined transition-transform group-hover:translate-x-0.5"
                        style={{ color: '#2e3447', fontSize: 20 }}>chevron_right</span>
                    </div>

                    {total > 0 ? (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'Victorias', value: wins,   color: '#4be277',  bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)' },
                            { label: 'Empates',   value: draws,  color: '#adb4ce',  bg: 'rgba(46,52,71,0.3)',   border: '#2e3447' },
                            { label: 'Derrotas',  value: losses, color: '#ffb4ab',  bg: 'rgba(255,180,171,0.05)', border: 'rgba(255,180,171,0.2)' },
                          ].map(({ label, value, color, bg, border }) => (
                            <div key={label} className="flex items-center justify-center gap-2 rounded-xl border py-2.5"
                              style={{ backgroundColor: bg, borderColor: border }}>
                              <span className="text-xl font-extrabold" style={{ color, fontFamily: 'Sora, sans-serif' }}>{value}</span>
                              <span className="text-[10px] font-bold uppercase" style={{ color: '#adb4ce' }}>{label}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-center mt-2" style={{ color: '#adb4ce' }}>
                          GF&nbsp;<span style={{ color: '#4be277' }}>{goalsFor}</span>
                          &nbsp;·&nbsp;
                          GC&nbsp;<span style={{ color: '#ffb4ab' }}>{goalsAgainst}</span>
                          &nbsp;·&nbsp;
                          <span style={{ color: diff > 0 ? '#4be277' : diff < 0 ? '#ffb4ab' : '#adb4ce' }}>
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-center py-1" style={{ color: '#2e3447' }}>Sin partidos registrados aún</p>
                    )}
                  </Link>

                  <div className="flex items-center justify-between px-5 pb-4">
                    {total > 0 ? (
                      <Link
                        href={`/dashboard/season/${season.id}/stats`}
                        className="flex items-center gap-1.5 text-xs font-bold transition-colors hover:underline"
                        style={{ color: '#adb4ce' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#4be277' }}>leaderboard</span>
                        Ver estadísticas
                      </Link>
                    ) : (
                      <Link
                        href={`/dashboard/season/${season.id}?new=1`}
                        className="flex items-center gap-1.5 text-xs font-bold transition-colors"
                        style={{ color: '#4be277' }}
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
