import { createTeam } from '../actions'
import Link from 'next/link'
import { PageTransition } from '@/components/ui/page-transition'

export default function NewTeamPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <PageTransition>
      <main className="max-w-xl mx-auto px-4 py-8 pb-10">

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard"
            className="flex items-center gap-1 text-xs hover:underline mb-4"
            style={{ color: '#adb4ce' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span>
            Volver al inicio
          </Link>
          <h1 className="text-[28px] font-extrabold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
            Nuevo equipo
          </h1>
          <p className="text-sm mt-1" style={{ color: '#adb4ce' }}>
            Configura los datos básicos. Podrás editarlos después.
          </p>
        </div>

        {/* Card formulario */}
        <section className="rounded-[24px] border border-[#1e293b] overflow-hidden" style={{ backgroundColor: '#0f172a' }}>

          <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1e293b]">
            <span className="material-symbols-outlined" style={{ color: '#4be277', fontSize: 22 }}>sports_soccer</span>
            <h2 className="text-[16px] font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              Datos del equipo
            </h2>
          </div>

          <form action={createTeam} className="p-6 flex flex-col gap-5">

            {/* Nombre */}
            <div className="flex flex-col gap-2">
              <label htmlFor="name"
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: '#adb4ce' }}>
                Nombre del equipo
              </label>
              <input id="name" name="name" type="text" required
                placeholder="ej. CD Ilumberri"
                className="rounded-xl px-4 text-sm"
                style={{ minHeight: 44 }}
              />
            </div>

            {/* Género */}
            <div className="flex flex-col gap-2">
              <label htmlFor="gender"
                className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2"
                style={{ color: '#adb4ce' }}>
                Género del equipo
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold normal-case"
                  style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#4be277', border: '1px solid rgba(34,197,94,0.2)' }}>
                  Afecta al lenguaje de la app
                </span>
              </label>
              <select id="gender" name="gender" required
                className="rounded-xl px-4 text-sm"
                style={{ minHeight: 44 }}>
                <option value="">Selecciona el género...</option>
                <option value="Femenino">Femenino — jugadoras, porteras, delanteras...</option>
                <option value="Masculino">Masculino — jugadores, porteros, delanteros...</option>
                <option value="Mixto">Mixto</option>
              </select>
            </div>

            {/* Categoría */}
            <div className="flex flex-col gap-2">
              <label htmlFor="category"
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: '#adb4ce' }}>
                Categoría
                <span className="ml-2 text-[10px] font-normal normal-case" style={{ color: '#2e3447' }}>
                  (opcional)
                </span>
              </label>
              <input id="category" name="category" type="text"
                placeholder="ej. Primera Autonómica"
                className="rounded-xl px-4 text-sm"
                style={{ minHeight: 44 }}
              />
            </div>

            <ErrorMessage searchParams={searchParams} />

            <button type="submit"
              className="flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer mt-2"
              style={{
                backgroundColor: '#22c55e',
                color: '#003915',
                minHeight: 48,
                boxShadow: '0 0 16px rgba(34,197,94,0.25)',
                fontFamily: 'Sora, sans-serif',
              }}>
              <span className="material-symbols-outlined text-lg">add</span>
              Crear equipo
            </button>
          </form>
        </section>

      </main>
    </PageTransition>
  )
}

async function ErrorMessage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  if (!error) return null
  return (
    <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm" style={{ color: '#ffb4ab' }}>
      {error}
    </p>
  )
}
