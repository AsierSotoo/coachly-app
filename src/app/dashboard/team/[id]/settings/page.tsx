import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { updateTeam } from '../../actions'
import { LogoUpload } from '@/components/team/logo-upload'
import { DeleteTeamButton } from '@/components/team/delete-team-button'
import { PageTransition } from '@/components/ui/page-transition'
import Link from 'next/link'

export default async function TeamSettingsPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const { id: teamId } = await params
  const supabase = await createClient()

  const [{ data: team }, { data: seasons }, { count: playerCount }] = await Promise.all([
    supabase.from('teams').select('*').eq('id', teamId).single(),
    supabase.from('seasons').select('id, name, created_at, matches(id, goals_for, goals_against)').eq('team_id', teamId).order('created_at', { ascending: false }),
    supabase.from('players').select('id', { count: 'exact', head: true }).eq('team_id', teamId),
  ])
  if (!team) notFound()
  const sp = await searchParams

  type SeasonWithMatches = { id: string; name: string; created_at: string; matches: { id: string; goals_for: number; goals_against: number }[] }
  const seasonsTyped = (seasons ?? []) as SeasonWithMatches[]
  const allMatches   = seasonsTyped.flatMap(s => s.matches)
  const totalW  = allMatches.filter(m => m.goals_for > m.goals_against).length
  const totalE  = allMatches.filter(m => m.goals_for === m.goals_against).length
  const totalD  = allMatches.filter(m => m.goals_for < m.goals_against).length
  const totalGF = allMatches.reduce((s, m) => s + m.goals_for, 0)
  const totalGA = allMatches.reduce((s, m) => s + m.goals_against, 0)
  const totalPts = totalW * 3 + totalE
  const winPct  = allMatches.length > 0 ? Math.round((totalW / allMatches.length) * 100) : 0

  return (
    <PageTransition>
      <main className="max-w-2xl mx-auto px-4 md:px-10 py-8 pb-10">

        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/team/${teamId}/players`}
            className="text-xs hover:underline flex items-center gap-1 mb-4"
            style={{ color: '#adb4ce' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span>
            Volver a la plantilla
          </Link>
          <h1 className="text-[28px] font-extrabold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
            Ajustes del equipo
          </h1>
          <p className="text-sm mt-1" style={{ color: '#adb4ce' }}>{team.name}</p>
        </div>

        {/* Escudo */}
        <section className="mb-6 rounded-[24px] border border-[#1e293b] p-6" style={{ backgroundColor: '#0f172a' }}>
          <div className="flex items-center gap-3 mb-5">
            <span className="material-symbols-outlined" style={{ color: '#4be277' }}>shield</span>
            <h2 className="text-[16px] font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              Escudo del equipo
            </h2>
          </div>
          <LogoUpload teamId={teamId} currentUrl={team.logo_url} teamName={team.name} />
        </section>

        {/* Historial global del equipo */}
        {allMatches.length > 0 && (
          <section className="mb-6 rounded-[24px] border border-[#1e293b] overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1e293b]">
              <span className="material-symbols-outlined" style={{ color: '#4be277' }}>history</span>
              <h2 className="text-[16px] font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Historial del equipo</h2>
              <span className="ml-auto text-[11px]" style={{ color: '#475569' }}>
                {seasonsTyped.length} temp. · {playerCount ?? 0} jugadoras
              </span>
            </div>
            {/* Grid de métricas */}
            <div className="grid grid-cols-3 divide-x divide-[#1e293b] border-b border-[#1e293b]">
              {[
                { label: 'Partidos', value: allMatches.length, color: '#dce1fb' },
                { label: 'Victorias', value: `${totalW} (${winPct}%)`, color: '#4be277' },
                { label: 'Puntos', value: totalPts, color: '#4be277' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center py-4">
                  <p className="text-[26px] font-extrabold leading-none" style={{ color, fontFamily: 'Sora, sans-serif' }}>{value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: '#475569' }}>{label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 divide-x divide-[#1e293b]">
              {[
                { label: 'V', value: totalW,  color: '#4be277' },
                { label: 'E', value: totalE,  color: '#adb4ce' },
                { label: 'D', value: totalD,  color: '#ffb4ab' },
                { label: 'GD', value: (totalGF - totalGA) >= 0 ? `+${totalGF - totalGA}` : String(totalGF - totalGA), color: (totalGF - totalGA) >= 0 ? '#4be277' : '#ffb4ab' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center py-3">
                  <p className="text-lg font-black" style={{ color, fontFamily: 'Sora, sans-serif' }}>{value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: '#334155' }}>{label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 px-6 py-3 border-t border-[#1e293b]">
              <span className="text-xs" style={{ color: '#475569' }}>
                GF <span style={{ color: '#4be277', fontWeight: 700 }}>{totalGF}</span>
                {' · '}
                GC <span style={{ color: '#ffb4ab', fontWeight: 700 }}>{totalGA}</span>
                {' · '}
                Media <span style={{ color: '#dce1fb', fontWeight: 700 }}>{allMatches.length > 0 ? (totalGF / allMatches.length).toFixed(1) : '0.0'}</span> goles/partido
              </span>
            </div>
            {/* Temporadas */}
            {seasonsTyped.length > 0 && (
              <div className="border-t border-[#1e293b] px-6 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Temporadas</p>
                <div className="flex flex-col gap-2">
                  {seasonsTyped.map(s => {
                    const w = s.matches.filter(m => m.goals_for > m.goals_against).length
                    const e = s.matches.filter(m => m.goals_for === m.goals_against).length
                    const d = s.matches.filter(m => m.goals_for < m.goals_against).length
                    return (
                      <Link key={s.id} href={`/dashboard/season/${s.id}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors hover:bg-[#151b2d]">
                        <p className="text-sm font-semibold text-white flex-1">{s.name}</p>
                        <div className="flex items-center gap-2 text-[11px]" style={{ color: '#adb4ce' }}>
                          <span style={{ color: '#4be277' }}>{w}V</span>
                          <span>{e}E</span>
                          <span style={{ color: '#ffb4ab' }}>{d}D</span>
                          <span className="ml-1" style={{ color: '#475569' }}>{s.matches.length} PJ</span>
                        </div>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#334155' }}>chevron_right</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Datos del equipo */}
        <section className="rounded-[24px] border border-[#1e293b] overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
          <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1e293b]">
            <span className="material-symbols-outlined" style={{ color: '#4be277' }}>settings</span>
            <h2 className="text-[16px] font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              Información del equipo
            </h2>
          </div>

          <form action={updateTeam} className="p-6 flex flex-col gap-5">
            <input type="hidden" name="team_id" value={teamId} />

            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>
                Nombre del equipo
              </label>
              <input id="name" name="name" type="text" required defaultValue={team.name}
                className="rounded-xl px-4 text-sm"
                style={{ minHeight: 44 }}
              />
            </div>

            {/* GÉNERO — campo principal, bien destacado */}
            <div className="flex flex-col gap-2">
              <label htmlFor="gender" className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2"
                style={{ color: '#adb4ce' }}>
                Género del equipo
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                  style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#4be277', border: '1px solid rgba(34,197,94,0.2)' }}>
                  Afecta al lenguaje de la app
                </span>
              </label>
              <select id="gender" name="gender" defaultValue={team.gender ?? ''}
                className="rounded-xl px-4 text-sm"
                style={{ minHeight: 44 }}>
                <option value="">Sin especificar (usa femenino por defecto)</option>
                <option value="Femenino">Femenino — jugadoras, porteras, delanteras...</option>
                <option value="Masculino">Masculino — jugadores, porteros, delanteros...</option>
                <option value="Mixto">Mixto — usa femenino por defecto</option>
              </select>
              <p className="text-xs" style={{ color: '#adb4ce', opacity: 0.7 }}>
                Selecciona el género para que la app use los términos correctos en toda la interfaz.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="category" className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>
                Categoría <span className="normal-case font-normal" style={{ color: '#2e3447' }}>(opcional)</span>
              </label>
              <input id="category" name="category" type="text"
                defaultValue={team.category ?? ''}
                placeholder="ej. Primera Autonómica"
                className="rounded-xl px-4 text-sm"
                style={{ minHeight: 44 }}
              />
            </div>

            {sp.error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm" style={{ color: '#ffb4ab' }}>
                {sp.error}
              </p>
            )}
            {sp.saved && (
              <p className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm" style={{ color: '#4be277' }}>
                Cambios guardados correctamente.
              </p>
            )}

            <button type="submit"
              className="flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
              style={{ backgroundColor: '#22c55e', color: '#003915', minHeight: 48 }}>
              <span className="material-symbols-outlined text-lg">save</span>
              Guardar cambios
            </button>
          </form>
        </section>

        {/* Zona de peligro */}
        <section className="mt-6 rounded-[24px] border p-6" style={{ borderColor: 'rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.03)' }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined" style={{ color: '#f87171', fontSize: 20 }}>warning</span>
            <h2 className="text-[16px] font-semibold" style={{ color: '#f87171', fontFamily: 'Sora, sans-serif' }}>
              Zona de peligro
            </h2>
          </div>
          <p className="text-sm mb-4" style={{ color: '#adb4ce' }}>
            Eliminar el equipo borrará permanentemente la plantilla, todas las temporadas, partidos y estadísticas asociadas.
          </p>
          <DeleteTeamButton teamId={teamId} teamName={team.name} />
        </section>

      </main>
    </PageTransition>
  )
}
