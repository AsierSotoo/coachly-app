import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { PageTransition } from '@/components/ui/page-transition'
import { TeamLogo } from '@/components/team/team-logo'
import { DeleteConvocatoriaButton } from '@/components/convocatoria/delete-convocatoria-button'

function dateStr(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function TeamInitials({ name }: { name: string }) {
  const letters = name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-[10px] font-black flex-shrink-0"
      style={{ backgroundColor: '#23293c', borderColor: '#151b2d', color: '#adb4ce' }}>
      {letters}
    </div>
  )
}

export default async function ConvocatoriasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ filter?: string }>
}) {
  const { id: seasonId } = await params
  const supabase = await createClient()

  const { data: season } = await supabase
    .from('seasons').select('*, teams(*)').eq('id', seasonId).single()
  if (!season) notFound()

  const team = season.teams as { id: string; name: string; logo_url?: string | null }

  const [{ data: convocatorias }, { count: totalPlayers }] = await Promise.all([
    supabase
      .from('convocatorias')
      .select('*, convocatoria_players(status), matches(opponent, played_at)')
      .eq('season_id', seasonId)
      .order('played_at', { ascending: false }),
    supabase.from('players').select('id', { count: 'exact', head: true }).eq('team_id', team.id).eq('active', true),
  ])

  const sp = await searchParams
  const filter = sp.filter ?? 'todas'
  const today  = new Date().toISOString().split('T')[0]
  const squadSize = totalPlayers ?? 0

  const all = (convocatorias ?? []).map(c => {
    const players = (c.convocatoria_players as { status: string }[]) ?? []
    const convocadas  = players.filter(p => p.status !== 'no_convocada').length
    const completed   = convocadas > 0
    const pct         = squadSize > 0 ? Math.round((convocadas / squadSize) * 100) : 0
    return { ...c, convocadas, completed, pct }
  })

  const pendingList   = all.filter(c => !c.completed)
  const completedList = all.filter(c => c.completed)
  const nextMatch     = [...all]
    .filter(c => c.played_at >= today)
    .sort((a, b) => a.played_at.localeCompare(b.played_at))[0] ?? null

  const filtered = filter === 'pendientes' ? pendingList
                 : filter === 'completadas' ? completedList
                 : all

  const tabs = [
    { key: 'todas',       label: 'Todas',       count: all.length },
    { key: 'pendientes',  label: 'Pendientes',  count: pendingList.length },
    { key: 'completadas', label: 'Completadas', count: completedList.length },
  ]

  return (
    <PageTransition>
      <main className="max-w-7xl mx-auto px-4 md:px-10 py-8 pb-32 md:pb-10">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <TeamLogo name={team.name} logoUrl={team.logo_url} size="sm" />
              <Link href={`/dashboard/season/${seasonId}`}
                className="text-xs hover:underline" style={{ color: '#adb4ce' }}>
                ← {season.name}
              </Link>
            </div>
            <h2 className="text-[32px] font-extrabold leading-tight text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              Gestión de Convocatorias
            </h2>
            <p className="text-sm mt-1" style={{ color: '#adb4ce' }}>
              Planifica y organiza el roster para tus próximos compromisos competitivos.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/dashboard/season/${seasonId}/convocatorias/new`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold active:scale-95 transition-all"
              style={{ backgroundColor: '#22c55e', color: '#003915', fontFamily: 'Sora, sans-serif' }}
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Nueva Convocatoria
            </Link>
          </div>
        </div>

        {/* ── Stat Cards ──────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          {/* Pendientes */}
          <div className="flex items-center justify-between rounded-xl border p-6"
            style={{ backgroundColor: '#191f31', borderColor: '#2e3447' }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#adb4ce' }}>Pendientes</p>
              <p className="text-[32px] font-extrabold leading-none text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                {String(pendingList.length).padStart(2, '0')}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(147,0,10,0.2)' }}>
              <span className="material-symbols-outlined" style={{ color: '#ffb4ab' }}>pending_actions</span>
            </div>
          </div>

          {/* Completadas */}
          <div className="flex items-center justify-between rounded-xl border p-6"
            style={{ backgroundColor: '#191f31', borderColor: '#2e3447' }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#adb4ce' }}>Completadas</p>
              <p className="text-[32px] font-extrabold leading-none text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                {String(completedList.length).padStart(2, '0')}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
              <span className="material-symbols-outlined" style={{ color: '#4be277' }}>check_circle</span>
            </div>
          </div>

          {/* Próximo Partido */}
          <div className="relative overflow-hidden flex items-center justify-between rounded-xl border p-6"
            style={{ backgroundColor: '#191f31', borderColor: '#2e3447' }}>
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl pointer-events-none"
              style={{ backgroundColor: 'rgba(75,226,119,0.08)' }} />
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#4be277' }}>Próximo Partido</p>
              {nextMatch ? (
                <>
                  <p className="text-base font-bold text-white leading-tight">vs {nextMatch.opponent}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#adb4ce' }}>
                    {dateStr(nextMatch.played_at)}
                  </p>
                </>
              ) : (
                <p className="text-sm" style={{ color: '#adb4ce' }}>Sin próximos partidos</p>
              )}
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center relative z-10"
              style={{ backgroundColor: '#3f465c' }}>
              <span className="material-symbols-outlined" style={{ color: '#bec6e0' }}>sports_soccer</span>
            </div>
          </div>
        </section>

        {/* ── Tabla con filtros ────────────────────────────────────────── */}
        <section className="rounded-[24px] border border-[#1e293b] overflow-hidden"
          style={{ backgroundColor: '#191f31' }}>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 border-b border-[#1e293b]"
            style={{ backgroundColor: 'rgba(35,41,60,0.5)' }}>
            <div className="flex items-center gap-6">
              {tabs.map(tab => (
                <Link
                  key={tab.key}
                  href={`/dashboard/season/${seasonId}/convocatorias?filter=${tab.key}`}
                  className="text-sm font-bold pb-1 transition-colors border-b-2"
                  style={{
                    color: filter === tab.key ? '#4be277' : '#adb4ce',
                    borderColor: filter === tab.key ? '#4be277' : 'transparent',
                  }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: filter === tab.key ? 'rgba(34,197,94,0.15)' : '#23293c', color: filter === tab.key ? '#4be277' : '#adb4ce' }}>
                      {tab.count}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: '#2e3447' }}>groups</span>
              <p className="text-sm font-medium text-white mb-1">Sin convocatorias {filter !== 'todas' ? filter : ''}</p>
              <p className="text-xs mb-5" style={{ color: '#adb4ce' }}>Créalas antes del partido y gestiona el roster</p>
              <Link
                href={`/dashboard/season/${seasonId}/convocatorias/new`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                style={{ backgroundColor: '#22c55e', color: '#003915' }}
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Crear primera convocatoria
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1e293b]" style={{ backgroundColor: 'rgba(21,27,45,0.5)' }}>
                      {['Partido', 'Fecha', 'Estado', 'Convocadas', 'Acciones'].map((h, i) => (
                        <th key={h}
                          className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: '#adb4ce', textAlign: i === 4 ? 'right' : 'left' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.id}
                        className="border-b border-[#1e293b] last:border-0 transition-colors hover:bg-[#23293c]/40 group">

                        {/* Partido */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            {/* Escudos superpuestos */}
                            <div className="flex items-center -space-x-2 flex-shrink-0">
                              <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-[10px] font-black z-10"
                                style={{ backgroundColor: '#23293c', borderColor: '#151b2d', color: '#4be277' }}>
                                {team.name.slice(0, 2).toUpperCase()}
                              </div>
                              <TeamInitials name={c.opponent} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">
                                {team.name} <span style={{ color: '#adb4ce', fontWeight: 400 }}>vs</span> {c.opponent}
                              </p>
                              {c.matches && (
                                <p className="text-[11px] mt-0.5" style={{ color: '#adb4ce' }}>
                                  Vinculado a partido registrado
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Fecha */}
                        <td className="px-6 py-5">
                          <p className="text-sm text-white">{dateStr(c.played_at)}</p>
                          {c.played_at >= today && (
                            <p className="text-[11px] mt-0.5 font-bold" style={{ color: '#4be277' }}>Próximo</p>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="px-6 py-5">
                          {c.completed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border"
                              style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#4be277' }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4be277' }} />
                              COMPLETADA
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border"
                              style={{ backgroundColor: 'rgba(255,180,171,0.1)', borderColor: 'rgba(255,180,171,0.3)', color: '#ffb4ab' }}>
                              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#ffb4ab' }} />
                              PENDIENTE
                            </span>
                          )}
                        </td>

                        {/* Convocadas */}
                        <td className="px-6 py-5">
                          <div className="w-full max-w-[120px]">
                            <div className="flex justify-between text-[11px] mb-1.5">
                              <span className="font-bold text-white">{c.convocadas}{squadSize > 0 ? ` / ${squadSize}` : ''}</span>
                              {squadSize > 0 && <span style={{ color: '#adb4ce' }}>{c.pct}%</span>}
                            </div>
                            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: '#2e3447' }}>
                              <div className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${squadSize > 0 ? c.pct : 0}%`, backgroundColor: '#22c55e' }} />
                            </div>
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2">
                            {c.completed ? (
                              <Link
                                href={`/dashboard/season/${seasonId}/convocatorias/${c.id}`}
                                className="px-4 py-2 rounded-lg text-[11px] font-bold border transition-all hover:bg-[#23293c] active:scale-95"
                                style={{ backgroundColor: '#23293c', borderColor: '#2e3447', color: '#dce1fb' }}
                              >
                                Ver Detalles
                              </Link>
                            ) : (
                              <Link
                                href={`/dashboard/season/${seasonId}/convocatorias/${c.id}`}
                                className="px-4 py-2 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                                style={{ backgroundColor: '#22c55e', color: '#003915' }}
                              >
                                Gestionar Lista
                              </Link>
                            )}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <DeleteConvocatoriaButton id={c.id} seasonId={seasonId} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer de tabla */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#1e293b]"
                style={{ backgroundColor: '#0f172a' }}>
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>
                  Mostrando {filtered.length} de {all.length} convocatoria{all.length !== 1 ? 's' : ''} registrada{all.length !== 1 ? 's' : ''}
                </p>
              </div>
            </>
          )}
        </section>
      </main>
    </PageTransition>
  )
}
