import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500">
          <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white">C</span>
        </div>

        <h1 className="mb-2 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-white">
          Coachly
        </h1>
        <p className="mb-10 text-sm text-slate-400">
          Las estadísticas de tu equipo, en un sitio.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/register"
            className="flex h-12 items-center justify-center rounded-xl bg-green-500 text-sm font-semibold text-white transition-colors hover:bg-green-400 cursor-pointer"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/login"
            className="flex h-12 items-center justify-center rounded-xl border border-slate-700 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 cursor-pointer"
          >
            Iniciar sesión
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-600">
          Diseñado para entrenadores de fútbol
        </p>
      </div>
    </div>
  )
}
