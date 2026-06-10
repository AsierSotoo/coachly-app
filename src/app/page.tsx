import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-white px-4">
      <main className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Coachly
        </h1>
        <p className="max-w-sm text-base text-gray-500">
          Las estadísticas de tu equipo, en un sitio.
        </p>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Crear cuenta
          </Link>
        </div>
      </main>
    </div>
  )
}
