import Image from 'next/image'
import Link from 'next/link'

const highlights = [
  { icon: 'groups', title: 'Plantilla actualizada', description: 'Dorsales, posiciones y disponibilidad.' },
  { icon: 'sports_soccer', title: 'Partidos al día', description: 'Resultado, convocatoria y participación.' },
  { icon: 'leaderboard', title: 'Datos para decidir', description: 'Minutos, goles, asistencias y evolución.' },
]

export function LandingPageRedesign() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-12" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--tx)' }}>
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center gap-3 py-3">
          <Image src="/logo.png" alt="Coachly" width={40} height={40} className="h-10 w-10 rounded-xl object-cover" priority />
          <span className="font-[family-name:var(--font-heading)] text-lg font-bold tracking-tight">Coachly</span>
        </header>

        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-400">Gestión de equipos de fútbol</p>
            <h1 className="mt-4 font-[family-name:var(--font-heading)] text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              El equipo, claro después de cada partido.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 sm:text-lg" style={{ color: 'var(--tx-3)' }}>
              Registra resultados, minutos y rendimiento de tu plantilla sin hojas de cálculo ni trabajo extra.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-green-500 px-5 text-sm font-bold text-slate-950 transition-colors hover:bg-green-400">
                Crear cuenta gratis
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border px-5 text-sm font-semibold transition-colors hover:text-green-400"
                style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)' }}
              >
                Iniciar sesión
              </Link>
            </div>
            <p className="mt-5 text-sm" style={{ color: 'var(--tx-4)' }}>Gratis para empezar · Sin tarjeta de crédito</p>
          </div>

          <div
            className="border-y py-6 sm:rounded-xl sm:border sm:p-6"
            style={{ borderColor: 'var(--bdr-strong)', backgroundColor: 'var(--bg-card)' }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--tx-4)' }}>Una temporada, en orden</p>
            <div className="mt-5 divide-y" style={{ borderColor: 'var(--bdr-strong)' }}>
              {highlights.map(({ icon, title, description }) => (
                <div key={title} className="flex items-center gap-4 py-4">
                  <span className="material-symbols-outlined text-green-400" aria-hidden="true">{icon}</span>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--tx)' }}>{title}</p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--tx-3)' }}>{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
