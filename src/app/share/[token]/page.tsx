import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import { TeamLogo } from '@/components/team/team-logo'
import { PlayerAvatar } from '@/components/team/player-avatar'
import { getTeamTerms } from '@/lib/team-terms'
import { DownloadImageButton } from '@/components/share/download-image-button'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('seasons').select('name, teams(name)').eq('share_token', token).single()
  if (!data) return { title: 'Estadísticas · Coachly' }
  const team = Array.isArray(data.teams) ? data.teams[0] : data.teams as { name: string } | null
  return {
    title: `${data.name}${team ? ` · ${team.name}` : ''} · Coachly`,
    description: 'Estadísticas de temporada compartidas desde Coachly',
  }
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: season } = await supabase
    .from('seasons')
    .select('*, teams(*)')
    .eq('share_token', token)
    .single()

  if (!season) notFound()

  const team = season.teams as { id: string; name: string; logo_url?: string | null; gender?: string | null }
  const terms = getTeamTerms(team.gender)

  const { data: matches } = await supabase
    .from('matches').select('*').eq('season_id', season.id).order('played_at')

  const matchIdsList = matches?.map(m => m.id) ?? []
  const { data: appearances } = matchIdsList.length
    ? await supabase.from('appearances').select('*, players(name, number, position, photo_url)').in('match_id', matchIdsList)
    : { data: [] }

  const wins   = matches?.filter(m => m.goals_for > m.goals_against).length ?? 0
  const draws  = matches?.filter(m => m.goals_for === m.goals_against).length ?? 0
  const losses = matches?.filter(m => m.goals_for < m.goals_against).length ?? 0
  const gf     = matches?.reduce((s, m) => s + m.goals_for, 0) ?? 0
  const ga     = matches?.reduce((s, m) => s + m.goals_against, 0) ?? 0
  const total  = matches?.length ?? 0
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0

  // Racha reciente (últimos 5)
  const recentForm = [...(matches ?? [])]
    .sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())
    .slice(0, 5)
    .reverse()
    .map(m => m.goals_for > m.goals_against ? 'V' : m.goals_for < m.goals_against ? 'D' : 'E')

  // Player stats
  type PS = { name: string; number: number | null; position: string | null; photoUrl: string | null; goals: number; assists: number; minutes: number; gamesPlayed: number }
  const statsMap = new Map<string, PS>()
  for (const app of appearances ?? []) {
    const p = app.players as { name: string; number: number | null; position: string | null; photo_url: string | null }
    if (!statsMap.has(app.player_id)) {
      statsMap.set(app.player_id, { name: p.name, number: p.number, position: p.position, photoUrl: p.photo_url, goals: 0, assists: 0, minutes: 0, gamesPlayed: 0 })
    }
    const s = statsMap.get(app.player_id)!
    s.goals += app.goals ?? 0
    s.assists += app.assists ?? 0
    s.minutes += app.minutes ?? 0
    if ((app.minutes ?? 0) > 0) s.gamesPlayed++
  }
  const stats     = Array.from(statsMap.values())
  const topScorer = [...stats].sort((a, b) => b.goals - a.goals)[0]
  const topAssist = [...stats].sort((a, b) => b.assists - a.assists)[0]
  const topMinutes = [...stats].sort((a, b) => b.minutes - a.minutes)[0]

  const byGoals   = [...stats].filter(s => s.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 5)
  const byAssists = [...stats].filter(s => s.assists > 0).sort((a, b) => b.assists - a.assists).slice(0, 5)
  const allPlayers = [...stats].filter(s => s.gamesPlayed > 0)
    .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists) || b.minutes - a.minutes)

  const dateStr = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#020617' }}>
      {/* Dot pattern */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '24px 24px', zIndex: 0 }} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-[#2e3447] overflow-hidden" style={{ backgroundColor: '#191f31' }}>
              <TeamLogo name={team.name} logoUrl={team.logo_url} size="lg" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{team.name}</h1>
              <p className="text-xs" style={{ color: '#adb4ce' }}>{season.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DownloadImageButton targetId="stats-share-card" filename={`${team.name}-${season.name}`} />
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <Image src="/logo.png" alt="Coachly" width={32} height={32} className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-bold group-hover:underline" style={{ color: '#4be277', fontFamily: 'Sora, sans-serif' }}>Coachly</span>
            </Link>
          </div>
        </div>

        {total === 0 ? (
          <div className="rounded-[24px] border-2 border-dashed border-[#2e3447]/50 py-16 text-center">
            <p className="text-sm" style={{ color: '#adb4ce' }}>Sin partidos registrados aún en esta temporada.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">

            {/* Resumen */}
            <section className="rounded-[24px] border border-[#1e293b] p-6" style={{ backgroundColor: '#0f172a' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#adb4ce' }}>Resumen de temporada</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Partidos', value: total, color: '#dce1fb' },
                  { label: 'Victorias', value: `${wins} (${winRate}%)`, color: '#4be277' },
                  { label: 'Goles', value: `${gf}`, color: '#4be277' },
                  { label: 'G. recibidos', value: `${ga}`, color: '#ffb4ab' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl border border-[#1e293b] px-4 py-3 text-center" style={{ backgroundColor: '#151b2d' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#adb4ce' }}>{label}</p>
                    <p className="text-2xl font-extrabold" style={{ color, fontFamily: 'Sora, sans-serif' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Racha */}
              {recentForm.length > 0 && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#1e293b]">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>Forma reciente</span>
                  <div className="flex gap-1.5">
                    {recentForm.map((r, i) => (
                      <div key={i} className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black border"
                        style={{
                          backgroundColor: r === 'V' ? 'rgba(34,197,94,0.15)' : r === 'D' ? 'rgba(255,180,171,0.1)' : 'rgba(148,163,184,0.1)',
                          borderColor: r === 'V' ? 'rgba(34,197,94,0.4)' : r === 'D' ? 'rgba(255,180,171,0.3)' : 'rgba(148,163,184,0.3)',
                          color: r === 'V' ? '#4be277' : r === 'D' ? '#ffb4ab' : '#94a3b8',
                        }}>
                        {r}
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px]" style={{ color: '#adb4ce' }}>{wins}V {draws}E {losses}D</span>
                </div>
              )}
            </section>

            {/* Tarjeta para compartir como imagen */}
            <div id="stats-share-card" style={{ backgroundColor: '#0f172a', borderRadius: 20, padding: 28, width: '100%', fontFamily: 'system-ui, sans-serif' }}>
              {/* Header de la tarjeta */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#191f31', border: '1px solid #2e3447', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TeamLogo name={team.name} logoUrl={team.logo_url} size="lg" />
                  </div>
                  <div>
                    <p style={{ color: '#ffffff', fontWeight: 800, fontSize: 16, margin: 0 }}>{team.name}</p>
                    <p style={{ color: '#adb4ce', fontSize: 11, margin: 0 }}>{season.name}</p>
                  </div>
                </div>
                <p style={{ color: '#4be277', fontWeight: 800, fontSize: 13 }}>Coachly</p>
              </div>

              {/* Resultado */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'V', value: wins, color: '#4be277', bg: 'rgba(34,197,94,0.12)' },
                  { label: 'E', value: draws, color: '#adb4ce', bg: 'rgba(46,52,71,0.4)' },
                  { label: 'D', value: losses, color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
                  { label: 'GF', value: gf, color: '#4be277', bg: 'rgba(34,197,94,0.08)' },
                  { label: 'GC', value: ga, color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} style={{ flex: 1, backgroundColor: bg, borderRadius: 10, padding: '10px 4px', textAlign: 'center' }}>
                    <p style={{ color, fontWeight: 800, fontSize: 22, margin: 0 }}>{value}</p>
                    <p style={{ color: '#64748b', fontSize: 9, fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Top goleadoras */}
              {byGoals.slice(0, 3).length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ color: '#475569', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Goleadoras</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {byGoals.slice(0, 3).map((p, i) => (
                      <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: i === 0 ? '#4be277' : '#475569', fontSize: 11, fontWeight: 700, width: 14 }}>{i + 1}</span>
                        <span style={{ color: '#dce1fb', fontSize: 13, fontWeight: 600, flex: 1 }}>{p.name}</span>
                        <span style={{ color: '#4be277', fontSize: 16, fontWeight: 800 }}>{p.goals}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Forma reciente */}
              {recentForm.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid #1e293b' }}>
                  <p style={{ color: '#475569', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Forma</p>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {recentForm.map((r, i) => (
                      <div key={i} style={{
                        width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800,
                        backgroundColor: r === 'V' ? 'rgba(34,197,94,0.2)' : r === 'D' ? 'rgba(248,113,113,0.15)' : 'rgba(148,163,184,0.15)',
                        color: r === 'V' ? '#4be277' : r === 'D' ? '#f87171' : '#94a3b8',
                      }}>{r}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Líderes */}
            {(topScorer || topAssist || topMinutes) && (
              <section className="rounded-[24px] border border-[#1e293b] p-6" style={{ backgroundColor: '#0f172a' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#adb4ce' }}>Líderes de temporada</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Máxima goleadora', player: topScorer, value: topScorer?.goals, icon: 'sports_soccer', color: '#4be277' },
                    { label: 'Más asistencias', player: topAssist, value: topAssist?.assists, icon: 'electric_bolt', color: '#facc15' },
                    { label: 'Más minutos', player: topMinutes, value: topMinutes?.minutes, unit: "'", icon: 'schedule', color: '#60a5fa' },
                  ].filter(l => l.player && (l.value ?? 0) > 0).map(({ label, player, value, unit, icon, color }) => (
                    <div key={label} className="flex items-center gap-3 rounded-xl border border-[#1e293b] px-4 py-3" style={{ backgroundColor: '#151b2d' }}>
                      <PlayerAvatar name={player!.name} photoUrl={player!.photoUrl} position={player!.position} size="sm" className="w-10 h-10 rounded-xl flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: '#adb4ce' }}>{label}</p>
                        <p className="text-sm font-bold truncate text-white">{player!.name}</p>
                        <p className="text-base font-extrabold" style={{ color, fontFamily: 'Sora, sans-serif' }}>{value}{unit ?? ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tabla de goleadoras */}
            {byGoals.length > 0 && (
              <section className="rounded-[24px] border border-[#1e293b] overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
                <div className="px-6 py-4 border-b border-[#1e293b]">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>Goleadoras</p>
                </div>
                <div className="divide-y divide-[#1e293b]">
                  {byGoals.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-4 px-6 py-3">
                      <span className="w-5 text-center text-xs font-bold" style={{ color: i === 0 ? '#4be277' : '#adb4ce' }}>{i + 1}</span>
                      <PlayerAvatar name={p.name} photoUrl={p.photoUrl} position={p.position} size="sm" className="w-8 h-8 rounded-lg flex-shrink-0" />
                      <span className="flex-1 text-sm font-semibold text-white truncate">{p.name}</span>
                      <span className="text-xl font-extrabold" style={{ color: '#4be277', fontFamily: 'Sora, sans-serif' }}>{p.goals}</span>
                      <span className="text-xs" style={{ color: '#adb4ce' }}>gol{p.goals !== 1 ? 'es' : ''}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tabla asistencias */}
            {byAssists.length > 0 && (
              <section className="rounded-[24px] border border-[#1e293b] overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
                <div className="px-6 py-4 border-b border-[#1e293b]">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>Asistencias</p>
                </div>
                <div className="divide-y divide-[#1e293b]">
                  {byAssists.map((p, i) => (
                    <div key={p.name + 'a'} className="flex items-center gap-4 px-6 py-3">
                      <span className="w-5 text-center text-xs font-bold" style={{ color: i === 0 ? '#facc15' : '#adb4ce' }}>{i + 1}</span>
                      <PlayerAvatar name={p.name} photoUrl={p.photoUrl} position={p.position} size="sm" className="w-8 h-8 rounded-lg flex-shrink-0" />
                      <span className="flex-1 text-sm font-semibold text-white truncate">{p.name}</span>
                      <span className="text-xl font-extrabold" style={{ color: '#facc15', fontFamily: 'Sora, sans-serif' }}>{p.assists}</span>
                      <span className="text-xs" style={{ color: '#adb4ce' }}>ast</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tabla completa de estadísticas */}
            {allPlayers.length > 0 && (
              <section className="rounded-[24px] border border-[#1e293b] overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
                <div className="px-6 py-4 border-b border-[#1e293b]">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>Estadísticas completas</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#1e293b]" style={{ backgroundColor: '#151b2d' }}>
                        {[
                          { h: terms.p.charAt(0).toUpperCase() + terms.p.slice(1), align: 'left' },
                          { h: 'PJ', align: 'center' },
                          { h: 'G', align: 'center' },
                          { h: 'A', align: 'center' },
                          { h: 'G+A', align: 'center' },
                          { h: "Min'", align: 'center' },
                        ].map(({ h, align }) => (
                          <th key={h} className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest"
                            style={{ color: '#adb4ce', textAlign: align as 'left' | 'center' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allPlayers.map((p, i) => (
                        <tr key={p.name} className="border-b border-[#1e293b] last:border-0"
                          style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(15,23,42,0.4)' }}>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <PlayerAvatar name={p.name} photoUrl={p.photoUrl} position={p.position} size="sm" className="w-7 h-7 rounded-lg flex-shrink-0" />
                              <span className="text-xs font-semibold text-white truncate max-w-[120px]">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center text-xs font-bold" style={{ color: '#adb4ce' }}>{p.gamesPlayed}</td>
                          <td className="px-3 py-2.5 text-center text-xs font-bold" style={{ color: p.goals > 0 ? '#4be277' : '#475569' }}>{p.goals}</td>
                          <td className="px-3 py-2.5 text-center text-xs font-bold" style={{ color: p.assists > 0 ? '#facc15' : '#475569' }}>{p.assists}</td>
                          <td className="px-3 py-2.5 text-center text-xs font-bold" style={{ color: p.goals + p.assists > 0 ? '#dce1fb' : '#475569' }}>{p.goals + p.assists}</td>
                          <td className="px-3 py-2.5 text-center text-xs" style={{ color: '#adb4ce' }}>{p.minutes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Últimos 5 partidos */}
            <section className="rounded-[24px] border border-[#1e293b] overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
              <div className="px-6 py-4 border-b border-[#1e293b]">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>Últimos partidos</p>
              </div>
              <div className="divide-y divide-[#1e293b]">
                {[...(matches ?? [])].sort((a, b) => b.played_at.localeCompare(a.played_at)).slice(0, 5).map(m => {
                  const r = m.goals_for > m.goals_against ? 'V' : m.goals_for < m.goals_against ? 'D' : 'E'
                  const rColor = r === 'V' ? '#4be277' : r === 'D' ? '#ffb4ab' : '#94a3b8'
                  const rBg = r === 'V' ? 'rgba(34,197,94,0.15)' : r === 'D' ? 'rgba(255,180,171,0.1)' : 'rgba(148,163,184,0.1)'
                  return (
                    <div key={m.id} className="flex items-center gap-4 px-6 py-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0"
                        style={{ backgroundColor: rBg, color: rColor }}>{r}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">vs {m.opponent}</p>
                        <p className="text-[11px]" style={{ color: '#adb4ce' }}>{dateStr(m.played_at)} · {m.home ? 'Local' : 'Visitante'}</p>
                      </div>
                      <span className="text-sm font-bold tabular-nums" style={{ color: '#4be277', fontFamily: 'Sora, sans-serif' }}>
                        {m.goals_for}–{m.goals_against}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>

          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs" style={{ color: '#475569' }}>
            Estadísticas generadas con{' '}
            <Link href="/" className="font-semibold hover:underline" style={{ color: '#4be277' }}>Coachly</Link>
            {' '}· La app de estadísticas para entrenadores
          </p>
        </div>
      </div>
    </div>
  )
}
