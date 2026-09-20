import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { updateTeam, toggleAvailabilityEnabled } from '../../actions'
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
    supabase.from('seasons').select('id, name, created_at, matches(id, goals_for, goals_against, status, competition_type)').eq('team_id', teamId).order('created_at', { ascending: false }),
    supabase.from('players').select('id', { count: 'exact', head: true }).eq('team_id', teamId),
  ])
  if (!team) notFound()
  const sp = await searchParams

  type SeasonWithMatches = { id: string; name: string; created_at: string; matches: { id: string; goals_for: number; goals_against: number; status?: string; competition_type?: string }[] }
  const seasonsTyped  = (seasons ?? []) as SeasonWithMatches[]
  const allRawMatches = seasonsTyped.flatMap(s => s.matches)
  const allMatches    = allRawMatches.filter(m => m.status !== 'scheduled')
  const ligaMatches   = allMatches.filter(m => (m.competition_type ?? 'liga') === 'liga')
  const totalW  = allMatches.filter(m => m.goals_for > m.goals_against).length
  const totalE  = allMatches.filter(m => m.goals_for === m.goals_against).length
  const totalD  = allMatches.filter(m => m.goals_for < m.goals_against).length
  const totalGF = allMatches.reduce((s, m) => s + m.goals_for, 0)
  const totalGA = allMatches.reduce((s, m) => s + m.goals_against, 0)
  const totalPts = ligaMatches.filter(m => m.goals_for > m.goals_against).length * 3 +
                   ligaMatches.filter(m => m.goals_for === m.goals_against).length
  const winPct  = allMatches.length > 0 ? Math.round((totalW / allMatches.length) * 100) : 0

  return (
    <PageTransition>
      <main className="max-w-2xl mx-auto px-4 md:px-10 py-8 pb-32 md:pb-10">

        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/team/${teamId}/players`}
            className="text-xs hover:underline flex items-center gap-1 mb-4"
            style={{ color: 'var(--tx-2)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span>
            Volver a la plantilla
          </Link>
          <h1 className="text-[28px] font-extrabold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--tx)' }}>
            Ajustes del equipo
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--tx-2)' }}>{team.name}</p>
        </div>

        {/* Escudo */}
        <section className="mb-6 rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}>
          <div className="flex items-center gap-3 mb-5">
            <span className="material-symbols-outlined" style={{ color: 'var(--accent)' }}>shield</span>
            <h2 className="text-[16px] font-semibold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--tx)' }}>
              Escudo del equipo
            </h2>
          </div>
          <LogoUpload teamId={teamId} currentUrl={team.logo_url} teamName={team.name} />
        </section>

        {/* Historial global del equipo */}
        {allMatches.length > 0 && (
          <section className="mb-6 rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}>
            <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: 'var(--bdr-strong)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--accent)' }}>history</span>
              <h2 className="text-[16px] font-semibold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--tx)' }}>Historial del equipo</h2>
              <span className="ml-auto text-[11px]" style={{ color: 'var(--tx-3)' }}>
                {seasonsTyped.length} temp. · {playerCount ?? 0} jugadoras
              </span>
            </div>
            {/* Grid de métricas */}
            <div className="grid grid-cols-3 border-b" style={{ borderColor: 'var(--bdr-strong)' }}>
              {[
                { label: 'Partidos', value: allMatches.length, color: 'var(--tx)' },
                { label: 'Victorias', value: `${totalW} (${winPct}%)`, color: 'var(--accent)' },
                { label: 'Puntos', value: totalPts, color: 'var(--accent)' },
              ].map(({ label, value, color }, i) => (
                <div key={label} className="flex flex-col items-center py-4" style={{ borderLeft: i > 0 ? '1px solid var(--bdr-strong)' : undefined }}>
                  <p className="text-[26px] font-extrabold leading-none" style={{ color, fontFamily: 'Sora, sans-serif' }}>{value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--tx-3)' }}>{label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4">
              {[
                { label: 'V', value: totalW,  color: 'var(--accent)' },
                { label: 'E', value: totalE,  color: 'var(--tx-2)' },
                { label: 'D', value: totalD,  color: '#ffb4ab' },
                { label: 'GD', value: (totalGF - totalGA) >= 0 ? `+${totalGF - totalGA}` : String(totalGF - totalGA), color: (totalGF - totalGA) >= 0 ? 'var(--accent)' : '#ffb4ab' },
              ].map(({ label, value, color }, i) => (
                <div key={label} className="flex flex-col items-center py-3" style={{ borderLeft: i > 0 ? '1px solid var(--bdr-strong)' : undefined }}>
                  <p className="text-lg font-black" style={{ color, fontFamily: 'Sora, sans-serif' }}>{value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--bdr-strong)' }}>{label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 px-6 py-3 border-t" style={{ borderColor: 'var(--bdr-strong)' }}>
              <span className="text-xs" style={{ color: 'var(--tx-3)' }}>
                GF <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{totalGF}</span>
                {' · '}
                GC <span style={{ color: '#ffb4ab', fontWeight: 700 }}>{totalGA}</span>
                {' · '}
                Media <span style={{ color: 'var(--tx)', fontWeight: 700 }}>{allMatches.length > 0 ? (totalGF / allMatches.length).toFixed(1) : '0.0'}</span> goles/partido
              </span>
            </div>
            {/* Temporadas */}
            {seasonsTyped.length > 0 && (
              <div className="border-t px-6 py-4" style={{ borderColor: 'var(--bdr-strong)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--tx-3)' }}>Temporadas</p>
                <div className="flex flex-col gap-2">
                  {seasonsTyped.map(s => {
                    const played = s.matches.filter(m => m.status !== 'scheduled')
                    const w = played.filter(m => m.goals_for > m.goals_against).length
                    const e = played.filter(m => m.goals_for === m.goals_against).length
                    const d = played.filter(m => m.goals_for < m.goals_against).length
                    return (
                      <Link key={s.id} href={`/dashboard/season/${s.id}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors hover:bg-[var(--bg-elevated)]">
                        <p className="text-sm font-semibold flex-1" style={{ color: 'var(--tx)' }}>{s.name}</p>
                        <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--tx-2)' }}>
                          <span style={{ color: 'var(--accent)' }}>{w}V</span>
                          <span>{e}E</span>
                          <span style={{ color: '#ffb4ab' }}>{d}D</span>
                          <span className="ml-1" style={{ color: 'var(--tx-3)' }}>{played.length} PJ</span>
                        </div>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--bdr-strong)' }}>chevron_right</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Datos del equipo */}
        <section className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}>
          <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: 'var(--bdr-strong)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent)' }}>settings</span>
            <h2 className="text-[16px] font-semibold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--tx)' }}>
              Información del equipo
            </h2>
          </div>

          <form action={updateTeam} className="p-6 flex flex-col gap-5">
            <input type="hidden" name="team_id" value={teamId} />

            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-2)' }}>
                Nombre del equipo
              </label>
              <input id="name" name="name" type="text" required defaultValue={team.name}
                className="rounded-xl px-4 text-sm focus:outline-none focus:border-[var(--accent)]"
                style={{ minHeight: 44, backgroundColor: 'var(--bg-input)', border: '1px solid var(--bdr-strong)', color: 'var(--tx)' }}
              />
            </div>

            {/* GÉNERO — campo principal, bien destacado */}
            <div className="flex flex-col gap-2">
              <label htmlFor="gender" className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2"
                style={{ color: 'var(--tx-2)' }}>
                Género del equipo
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                  style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                  Afecta al lenguaje de la app
                </span>
              </label>
              <select id="gender" name="gender" defaultValue={team.gender ?? ''}
                className="rounded-xl px-4 text-sm focus:outline-none focus:border-[var(--accent)]"
                style={{ minHeight: 44, backgroundColor: 'var(--bg-input)', border: '1px solid var(--bdr-strong)', color: 'var(--tx)', colorScheme: 'dark' }}>
                <option value="">Sin especificar (usa femenino por defecto)</option>
                <option value="Femenino">Femenino — jugadoras, porteras, delanteras...</option>
                <option value="Masculino">Masculino — jugadores, porteros, delanteros...</option>
                <option value="Mixto">Mixto — usa femenino por defecto</option>
              </select>
              <p className="text-xs" style={{ color: 'var(--tx-2)', opacity: 0.7 }}>
                Selecciona el género para que la app use los términos correctos en toda la interfaz.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="category" className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--tx-2)' }}>
                Categoría <span className="normal-case font-normal" style={{ color: 'var(--bdr-strong)' }}>(opcional)</span>
              </label>
              <input id="category" name="category" type="text"
                defaultValue={team.category ?? ''}
                placeholder="ej. Primera Autonómica"
                className="rounded-xl px-4 text-sm focus:outline-none placeholder:text-[#3e4d42] focus:border-[var(--accent)]"
                style={{ minHeight: 44, backgroundColor: 'var(--bg-input)', border: '1px solid var(--bdr-strong)', color: 'var(--tx)' }}
              />
            </div>

            {sp.error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm" style={{ color: '#ffb4ab' }}>
                {sp.error}
              </p>
            )}
            {sp.saved && (
              <p className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm" style={{ color: 'var(--accent)' }}>
                Cambios guardados correctamente.
              </p>
            )}

            <button type="submit"
              className="flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)', minHeight: 48 }}>
              <span className="material-symbols-outlined text-lg">save</span>
              Guardar cambios
            </button>
          </form>
        </section>

        {/* Funcionalidades opcionales */}
        <section className="mt-6 rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}>
          <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: 'var(--bdr-strong)' }}>
            <span className="material-symbols-outlined" style={{ color: '#a78bfa' }}>tune</span>
            <h2 className="text-[16px] font-semibold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--tx)' }}>Funcionalidades opcionales</h2>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--tx)' }}>Confirmación de disponibilidad</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--tx-3)' }}>
                  Genera un enlace por partido y compártelo con el grupo.
                  Las jugadoras confirman si van a jugar sin necesitar cuenta.
                </p>
              </div>
              <form action={toggleAvailabilityEnabled} className="flex-shrink-0 mt-0.5">
                <input type="hidden" name="team_id" value={teamId} />
                <input type="hidden" name="enabled" value={String(!(team as { availability_enabled?: boolean }).availability_enabled)} />
                <button type="submit"
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none"
                  style={{
                    backgroundColor: (team as { availability_enabled?: boolean }).availability_enabled ? '#a78bfa' : 'var(--bdr-strong)',
                    border: `1px solid ${(team as { availability_enabled?: boolean }).availability_enabled ? '#a78bfa' : 'var(--bdr-strong)'}`,
                  }}>
                  <span
                    className="inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200"
                    style={{ transform: `translateX(${(team as { availability_enabled?: boolean }).availability_enabled ? '20px' : '4px'})` }}
                  />
                </button>
              </form>
            </div>
            {(team as { availability_enabled?: boolean }).availability_enabled && (
              <div className="mt-3">
                <a href={`/dashboard/team/${teamId}/disponibilidad`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ color: '#a78bfa' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>event_available</span>
                  Ver disponibilidad
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Zona de peligro */}
        <section className="mt-6 rounded-2xl border p-6" style={{ borderColor: 'rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.03)' }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined" style={{ color: '#f87171', fontSize: 20 }}>warning</span>
            <h2 className="text-[16px] font-semibold" style={{ color: '#f87171', fontFamily: 'Sora, sans-serif' }}>
              Zona de peligro
            </h2>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--tx-2)' }}>
            Eliminar el equipo borrará permanentemente la plantilla, todas las temporadas, partidos y estadísticas asociadas.
          </p>
          <DeleteTeamButton teamId={teamId} teamName={team.name} />
        </section>

      </main>
    </PageTransition>
  )
}
