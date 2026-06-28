import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { updateTeam } from '../../actions'
import { LogoUpload } from '@/components/team/logo-upload'
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
  const { data: team } = await supabase.from('teams').select('*').eq('id', teamId).single()
  if (!team) notFound()
  const sp = await searchParams

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

      </main>
    </PageTransition>
  )
}
