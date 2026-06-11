import Link from 'next/link'
import { register, signInWithGoogle } from '@/app/auth/actions'

export default function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  return (
    <div className="flex min-h-full">

      {/* Panel izquierdo */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #071a07 0%, #0a2a0a 40%, #0d1f2d 100%)' }}>

        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(255,255,255,0.15) 48px, rgba(255,255,255,0.15) 96px)'
          }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full border-2 border-white/40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white/60" />
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/40" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-48 w-28 border-r-2 border-y-2 border-white/40" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-48 w-28 border-l-2 border-y-2 border-white/40" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

        <div className="relative z-10 p-10">
          <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-green-400 tracking-tight">Coachly</span>
        </div>

        <div className="relative z-10 p-10">
          <h2 className="text-2xl font-bold text-white leading-snug mb-4">
            Empieza a llevar las estadísticas de tu equipo hoy.
          </h2>
          <ul className="space-y-3">
            {[
              'Registro de partidos y jugadoras',
              'Estadísticas en tiempo real',
              'Acceso desde móvil o PC',
              'Gratis para empezar',
            ].map(item => (
              <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 text-green-400 text-xs">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm">

          <div className="mb-8 lg:hidden text-center">
            <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-green-400">Coachly</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-1">Crear cuenta</h1>
          <p className="text-slate-400 text-sm mb-8">Es gratis y tarda menos de un minuto</p>

          {/* Google */}
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800 h-12 text-sm font-medium text-white transition-colors hover:bg-slate-700 hover:border-slate-600 cursor-pointer"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Registrarse con Google
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">o con email</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <form action={register} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-slate-400">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" placeholder="tu@email.com" className="h-12 px-4 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-slate-400">Contraseña</label>
              <input id="password" name="password" type="password" required autoComplete="new-password" minLength={6} placeholder="Mínimo 6 caracteres" className="h-12 px-4 text-sm" />
            </div>

            <Feedback searchParams={searchParams} />

            <button type="submit" className="mt-1 flex h-12 items-center justify-center rounded-xl bg-green-500 text-sm font-bold text-white transition-colors hover:bg-green-400 cursor-pointer">
              Crear cuenta
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-semibold text-green-400 hover:text-green-300 transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

async function Feedback({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams
  if (params.error) return (
    <p className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{params.error}</p>
  )
  if (params.message) return (
    <p className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">{params.message}</p>
  )
  return null
}
