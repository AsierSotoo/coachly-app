import Link from 'next/link'
import { login } from '@/app/auth/actions'

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-500 mb-4">
            <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-white">C</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Bienvenido</h1>
          <p className="mt-1 text-sm text-slate-400">Entra en tu cuenta</p>
        </div>

        <form action={login} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Email
            </label>
            <input
              id="email" name="email" type="email" required autoComplete="email"
              placeholder="tu@email.com"
              className="h-12 px-4 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Contraseña
            </label>
            <input
              id="password" name="password" type="password" required autoComplete="current-password"
              placeholder="••••••••"
              className="h-12 px-4 text-sm"
            />
          </div>

          <ErrorMessage searchParams={searchParams} />

          <button
            type="submit"
            className="mt-2 flex h-12 items-center justify-center rounded-xl bg-green-500 text-sm font-semibold text-white transition-colors hover:bg-green-400 cursor-pointer"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="font-medium text-green-400 hover:text-green-300">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}

async function ErrorMessage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  if (!error) return null
  return (
    <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
      {error}
    </p>
  )
}
