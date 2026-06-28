import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createMatch } from '../actions'
import Link from 'next/link'
import { DeleteMatchButton } from '@/components/match/delete-match-button'
import { PageTransition } from '@/components/ui/page-transition'
import { TeamLogo } from '@/components/team/team-logo'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('seasons').select('name, teams(name)').eq('id', id).single()
  if (!data) return { title: 'Temporada' }
  const team = Array.isArray(data.teams) ? data.teams[0] : data.teams as { name: string } | null
  return { title: `${data.name}${team ? ` · ${team.name}` : ''}` }
}

function dateStr(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function OpponentInitial({ name }: { name: string }) {
  const letters = name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div className="w-10 h-10 rounded flex items-center justify-center text-[11px] font-black border flex-shrink-0"
      style={{ backgroundColor: '#23293c', borderColor: '#2e3447', color: '#adb4ce' }}>
      {letters}
    </div>
  )
}

export default async function SeasonPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; new?: string; q?: string }>
}) {
  const { id: seasonId } = await params
  const supabase = await createClient()

  const { data: season } = await supabase
    .from('seasons').select('*, teams(*)').eq('id', seasonId).single()
  if (!season) notFound()

  const { data: matchesRaw } = await supabase
    .from('matches')
    .select('*, convocatorias(id)')
    .eq('season_id', seasonId)
    .order('played_at', { ascending: false })

  const sp = await searchParams
  const team = season.teams as { id: string; name: string; logo_url?: string | null }

  const matches = matchesRaw ?? []
  const searchQ = sp.q?.toLowerCase() ?? ''
  const filtered = searchQ
    ? matches.filter(m => m.opponent.toLowerCase().includes(searchQ))
    : matches

  const wins   = matches.filter(m => m.goals_for > m.goals_against).length
  const draws  = matches.filter(m => m.goals_for === m.goals_against).length
  const losses = matches.filter(m => m.goals_for < m.goals_against).length
  const total  = matches.length

  const winRate   = total > 0 ? Math.round((wins   / total) * 100) : 0
  const drawRate  = total > 0 ? Math.round((draws  / total) * 100) : 0
  const lossRate  = total > 0 ? Math.round((losses / total) * 100) : 0

  const showForm = sp.new === '1' || !!sp.error || total === 0
  const opponents = [...new Set(matches.map(m => m.opponent))].sort()

  // Forma reciente (últimos 5, más reciente a la derecha)
  const recentForm = [...matches]
    .sort((a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime())
    .slice(-5)
    .map(m => m.goals_for > m.goals_against ? 'V' : m.goals_for < m.goals_against ? 'D' : 'E')

  return (
    <PageTransition>
      <main className="max-w-7xl mx-auto px-4 md:px-10 py-8 pb-32 md:pb-10">

        {/* ── Stats Cards ─────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          {/* Victorias */}
          <div
            className="relative overflow-hidden rounded-xl border p-6 group hover:border-[#22c55e]/50 transition-colors hover:-translate-y-0.5 duration-200"
            style={{ backgroundColor: '#151b2d', borderColor: '#2e3447' }}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity select-none pointer-events-none">
              <span className="material-symbols-outlined text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>trophy</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#adb4ce' }}>Victorias</p>
            <div className="flex items-end gap-2">
              <span className="text-[48px] font-extrabold leading-none" style={{ color: '#4be277', fontFamily: 'Sora, sans-serif' }}>{wins}</span>
              {total > 0 && (
                <span className="mb-1 flex items-center text-xs font-bold" style={{ color: '#4be277' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>trending_up</span>
                  {winRate}%
                </span>
              )}
            </div>
          </div>

          {/* Empates */}
          <div
            className="relative overflow-hidden rounded-xl border p-6 group hover:border-[#adb4ce]/30 transition-colors hover:-translate-y-0.5 duration-200"
            style={{ backgroundColor: '#151b2d', borderColor: '#2e3447' }}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity select-none pointer-events-none">
              <span className="material-symbols-outlined text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>drag_handle</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#adb4ce' }}>Empates</p>
            <div className="flex items-end gap-2">
              <span className="text-[48px] font-extrabold leading-none" style={{ color: '#bec6e0', fontFamily: 'Sora, sans-serif' }}>{draws}</span>
              {total > 0 && (
                <span className="mb-1 flex items-center text-xs font-bold" style={{ color: '#adb4ce' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>drag_handle</span>
                  {drawRate}%
                </span>
              )}
            </div>
          </div>

          {/* Derrotas */}
          <div
            className="relative overflow-hidden rounded-xl border p-6 group hover:border-[#ffb4ab]/30 transition-colors hover:-translate-y-0.5 duration-200"
            style={{ backgroundColor: '#151b2d', borderColor: '#2e3447' }}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity select-none pointer-events-none">
              <span className="material-symbols-outlined text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#adb4ce' }}>Derrotas</p>
            <div className="flex items-end gap-2">
              <span className="text-[48px] font-extrabold leading-none" style={{ color: '#ffb4ab', fontFamily: 'Sora, sans-serif' }}>{losses}</span>
              {total > 0 && (
                <span className="mb-1 flex items-center text-xs font-bold" style={{ color: '#ffb4ab' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>trending_down</span>
                  {lossRate}%
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ── Forma reciente ──────────────────────────────────────────── */}
        {recentForm.length > 0 && (
          <div className="flex items-center gap-3 mb-6 px-1">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>Forma</span>
            <div className="flex gap-1.5">
              {recentForm.map((r, i) => (
                <div key={i}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black border"
                  style={{
                    backgroundColor: r === 'V' ? 'rgba(34,197,94,0.15)' : r === 'D' ? 'rgba(255,180,171,0.1)' : 'rgba(148,163,184,0.1)',
                    borderColor:     r === 'V' ? 'rgba(34,197,94,0.4)' : r === 'D' ? 'rgba(255,180,171,0.3)' : 'rgba(148,163,184,0.3)',
                    color:           r === 'V' ? '#4be277' : r === 'D' ? '#ffb4ab' : '#94a3b8',
                  }}>
                  {r}
                </div>
              ))}
            </div>
            <span className="text-[11px]" style={{ color: '#adb4ce' }}>
              {wins}V {draws}E {losses}D · {total} PJ
            </span>
          </div>
        )}

        {/* ── Barra de acciones ────────────────────────────────────────── */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/season/${seasonId}?new=1`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm active:scale-95 transition-all"
              style={{ backgroundColor: '#22c55e', color: '#003915', fontFamily: 'Sora, sans-serif' }}
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Nuevo Partido
            </Link>
            <Link
              href={`/dashboard/team/${team.id}/players`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm border active:scale-95 transition-all hover:bg-[#23293c]"
              style={{ backgroundColor: '#2e3447', borderColor: '#3d4a3d', color: '#dce1fb' }}
            >
              <span className="material-symbols-outlined text-lg">person_pin</span>
              Gestionar Plantilla
            </Link>
          </div>

          {/* Buscador */}
          <form method="get" action={`/dashboard/season/${seasonId}`}
            className="flex items-center gap-2 rounded-lg border px-4 py-2.5 focus-within:border-[#4be277] transition-colors"
            style={{ backgroundColor: '#191f31', borderColor: '#2e3447' }}>
            <span className="material-symbols-outlined" style={{ color: '#adb4ce', fontSize: 18 }}>search</span>
            <input
              name="q"
              type="text"
              placeholder="Buscar rival o fecha..."
              defaultValue={sp.q ?? ''}
              className="bg-transparent border-none outline-none text-sm w-48"
              style={{ color: '#dce1fb' }}
            />
          </form>
        </section>

        {/* ── Formulario Nuevo Partido ─────────────────────────────────── */}
        {showForm && (
          <section
            className="mb-8 rounded-[24px] border border-[#1e293b] overflow-hidden"
            style={{ backgroundColor: '#0f172a' }}
          >
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1e293b]">
              <span className="material-symbols-outlined" style={{ color: '#4be277' }}>add_circle</span>
              <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>Nuevo Partido</h3>
            </div>
            <form action={createMatch} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="hidden" name="season_id" value={seasonId} />
              {opponents.length > 0 && (
                <datalist id="opponents-list">
                  {opponents.map(o => <option key={o} value={o} />)}
                </datalist>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>Rival</label>
                <input name="opponent" type="text" required placeholder="Nombre del rival" list="opponents-list"
                  className="border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#4be277] transition-all"
                  style={{ backgroundColor: '#0c1324', borderColor: '#2e3447', color: '#dce1fb' }} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>Fecha</label>
                <input name="played_at" type="date" required defaultValue={new Date().toISOString().split('T')[0]}
                  className="border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#4be277] transition-all"
                  style={{ backgroundColor: '#0c1324', borderColor: '#2e3447', color: '#dce1fb' }} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>Competición</label>
                <input name="competition" type="text" placeholder="Liga, Copa..."
                  className="border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#4be277] transition-all"
                  style={{ backgroundColor: '#0c1324', borderColor: '#2e3447', color: '#dce1fb' }} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>Campo</label>
                <select name="home"
                  className="border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#4be277] transition-all appearance-none"
                  style={{ backgroundColor: '#0c1324', borderColor: '#2e3447', color: '#dce1fb' }}>
                  <option value="true">Local</option>
                  <option value="false">Visitante</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>Resultado (nosotros — rival)</label>
                <div className="flex items-center justify-center gap-2 border rounded-xl px-4 py-2"
                  style={{ backgroundColor: '#0c1324', borderColor: '#2e3447' }}>
                  <input name="goals_for" type="number" min="0" defaultValue="0"
                    className="score-input" style={{ fontFamily: 'Sora, sans-serif' }} />
                  <span className="text-xl font-bold select-none" style={{ color: '#3d4a3d' }}>—</span>
                  <input name="goals_against" type="number" min="0" defaultValue="0"
                    className="score-input" style={{ fontFamily: 'Sora, sans-serif' }} />
                </div>
              </div>

              <div className="flex items-end">
                <button type="submit"
                  className="w-full h-[50px] rounded-xl flex items-center justify-center gap-2 text-sm font-bold active:scale-95 transition-transform cursor-pointer"
                  style={{ backgroundColor: '#22c55e', color: '#003915' }}>
                  <span className="material-symbols-outlined text-lg">add</span>
                  Crear Partido
                </button>
              </div>
            </form>
            {sp.error && (
              <p className="mx-6 mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm" style={{ color: '#ffb4ab' }}>
                {sp.error}
              </p>
            )}
          </section>
        )}

        {/* ── Tabla de Partidos ────────────────────────────────────────── */}
        <section
          className="rounded-[24px] border border-[#1e293b] overflow-hidden"
          style={{ backgroundColor: '#070d1f' }}
        >
          {/* Cabecera de la tabla */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b]"
            style={{ backgroundColor: '#191f31' }}
          >
            <div className="flex items-center gap-3">
              <TeamLogo name={team.name} logoUrl={team.logo_url} size="sm" />
              <h3 className="text-[20px] font-semibold" style={{ color: '#4be277', fontFamily: 'Sora, sans-serif' }}>
                Calendario y Resultados
              </h3>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/dashboard/season/${seasonId}/stats`}
                className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors hover:border-[#4be277]/50"
                style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)', color: '#4be277' }}
              >
                Stats
              </Link>
              <Link
                href={`/dashboard/season/${seasonId}/convocatorias`}
                className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors hover:border-[#adb4ce]/30"
                style={{ backgroundColor: '#2e3447', borderColor: '#3d4a3d', color: '#adb4ce' }}
              >
                Convocatorias
              </Link>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: '#2e3447' }}>sports_soccer</span>
              <p className="text-sm" style={{ color: '#adb4ce' }}>
                {searchQ ? `Sin resultados para "${searchQ}"` : 'Aún no hay partidos en esta temporada.'}
              </p>
            </div>
          ) : (
            <>
              {/* Columnas */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1e293b]" style={{ backgroundColor: '#151b2d' }}>
                      {['Est.', 'Oponente', 'Fecha', 'Convocatoria', 'Acciones'].map((h, i) => (
                        <th key={h}
                          className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: '#adb4ce', textAlign: i === 4 ? 'right' : 'left' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(match => {
                      const gf = match.goals_for ?? 0
                      const ga = match.goals_against ?? 0
                      const res  = gf > ga ? 'V' : gf < ga ? 'D' : 'E'
                      const dotStyle = res === 'V'
                        ? { backgroundColor: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.5)', color: '#003915' }
                        : res === 'D'
                          ? { backgroundColor: 'rgba(255,180,171,0.15)', boxShadow: '0 0 8px rgba(255,180,171,0.2)', color: '#ffb4ab', border: '1px solid #ffb4ab' }
                          : { backgroundColor: '#2e3447', color: '#bec6e0' }

                      const hasConvocatoria = (match.convocatorias as { id: string }[])?.length > 0

                      return (
                        <tr key={match.id}
                          className="border-b border-[#1e293b] last:border-0 group transition-colors"
                          style={{ backgroundColor: 'transparent' }}
                          onMouseEnter={undefined}
                        >
                          {/* Est. */}
                          <td className="px-6 py-5">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black"
                              style={dotStyle}
                            >
                              {res}
                            </div>
                          </td>

                          {/* Oponente */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <OpponentInitial name={match.opponent} />
                              <div>
                                <p className="text-sm font-bold text-white">{match.opponent}</p>
                                <p className="text-[11px] mt-0.5" style={{ color: '#adb4ce' }}>
                                  {match.home ? 'Local' : 'Visitante'}
                                  {match.competition ? ` · ${match.competition}` : ''}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Fecha */}
                          <td className="px-6 py-5">
                            <p className="text-sm font-medium text-white">{dateStr(match.played_at)}</p>
                            <p className="text-[11px] mt-0.5 font-bold tabular-nums" style={{ color: '#4be277', fontFamily: 'Sora, sans-serif' }}>
                              {gf}–{ga}
                            </p>
                          </td>

                          {/* Convocatoria */}
                          <td className="px-6 py-5">
                            {hasConvocatoria ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border"
                                style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)', color: '#4be277' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                Completada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border"
                                style={{ backgroundColor: 'rgba(234,179,8,0.1)', borderColor: 'rgba(234,179,8,0.2)', color: '#facc15' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>pending</span>
                                Pendiente
                              </span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-end gap-2">
                              {!hasConvocatoria && (
                                <Link
                                  href={`/dashboard/season/${seasonId}/convocatorias`}
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors hover:bg-[#22c55e]/10"
                                  style={{ backgroundColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)', color: '#4be277' }}
                                >
                                  Convocatoria
                                </Link>
                              )}
                              <Link
                                href={`/dashboard/season/${seasonId}/match/${match.id}`}
                                className="p-2 rounded transition-colors hover:bg-[#23293c]"
                                style={{ color: '#adb4ce' }}
                                title="Editar partido"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                              </Link>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <DeleteMatchButton matchId={match.id} seasonId={seasonId} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer de la tabla */}
              <div
                className="flex items-center justify-center px-6 py-4 border-t border-[#1e293b]"
                style={{ backgroundColor: '#0f172a' }}
              >
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>
                  {filtered.length} partido{filtered.length !== 1 ? 's' : ''} registrado{filtered.length !== 1 ? 's' : ''}
                </p>
              </div>
            </>
          )}
        </section>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer className="mt-8 flex items-center justify-between" style={{ color: '#adb4ce' }}>
          <p className="text-[11px]">© {new Date().getFullYear()} Coachly · {team.name}</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#4be277' }} />
              Sistema Online
            </span>
          </div>
        </footer>

      </main>
    </PageTransition>
  )
}
