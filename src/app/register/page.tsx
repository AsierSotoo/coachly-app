import Link from 'next/link'
import Image from 'next/image'
import { register, signInWithGoogle } from '@/app/auth/actions'

export default function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#020617' }}>

      {/* Panel izquierdo — foto editorial */}
      <div className="relative hidden lg:flex lg:w-[52%] flex-col justify-between overflow-hidden">

        <Image
          src="/coach-bg.jpg"
          alt="Entrenador en la banda"
          fill
          className="object-cover object-[center_30%]"
          priority
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-black/90" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/40 to-transparent" />

        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
              <Image src="/logo.png" alt="Coachly" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <span className="font-[family-name:var(--font-heading)] text-xl font-bold text-white tracking-tight">
              Coachly
            </span>
          </div>
        </div>

        <div className="relative z-10 px-10 pb-12">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-green-400">
            Para entrenadores de fútbol
          </p>
          <h2 className="text-4xl font-black text-white leading-[1.1] tracking-tight">
            Empieza hoy.<br />Es gratis.
          </h2>
          <p className="mt-4 text-sm text-white/50 leading-relaxed max-w-xs">
            Crea tu equipo, añade la plantilla y registra tu primer partido en menos de cinco minutos.
          </p>

          <div className="mt-8 h-px w-12 bg-green-500/60" />

          <div className="mt-6 flex flex-col gap-3">
            {[
              'Sin anuncios ni límites de jugadoras',
              'Estadísticas calculadas automáticamente',
              'Funciona desde el móvil',
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500/70" />
                <p className="text-[13px] text-white/50">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-14">
        <div className="w-full max-w-[340px]">

          {/* Hero móvil */}
          <div className="mb-10 lg:hidden">
            <div className="relative overflow-hidden rounded-2xl border p-6 text-center" style={{ borderColor: 'var(--bdr-strong)', background: 'linear-gradient(135deg, var(--bg-card) 0%, #0a1f0a 100%)' }}>
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-28 w-28 rounded-full border border-white/50" />
                <div className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/30" />
              </div>
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/60 to-transparent" />
              <div className="relative flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-green-500/20">
                  <Image src="/logo.png" alt="Coachly" width={56} height={56} className="w-full h-full object-cover" />
                </div>
                <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-green-400 tracking-tight">Coachly</span>
                <p className="text-sm" style={{ color: 'var(--tx-3)' }}>Estadísticas para entrenadores</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Crea tu cuenta</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--tx-4)' }}>Tarda menos de un minuto</p>
          </div>

          {/* Google */}
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-xl border h-11 text-sm font-medium transition-all active:scale-[0.98] cursor-pointer hover:bg-[var(--bg-elevated)]" style={{ borderColor: 'var(--bdr-strong)', backgroundColor: 'var(--bg-card)', color: 'var(--tx)' }}
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Registrarse con Google
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--bdr-strong)' }} />
            <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--tx-4)' }}>o</span>
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--bdr-strong)' }} />
          </div>

          <form action={register} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--tx-4)' }}>Tu nombre</label>
              <input
                id="name" name="name" type="text" required
                autoComplete="name" placeholder="Ej: Carlos García"
                className="h-11 px-4 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--tx-4)' }}>Email</label>
              <input
                id="email" name="email" type="email" required
                autoComplete="email" placeholder="tu@email.com"
                className="h-11 px-4 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--tx-4)' }}>Contraseña</label>
              <input
                id="password" name="password" type="password" required
                autoComplete="new-password" minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="h-11 px-4 text-sm"
              />
            </div>

            <Feedback searchParams={searchParams} />

            <button
              type="submit"
              className="mt-1 flex h-11 items-center justify-center rounded-xl bg-green-500 text-sm font-bold text-white transition-all hover:bg-green-400 active:scale-[0.98] cursor-pointer shadow-lg shadow-green-500/20"
            >
              Crear cuenta gratis
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--tx-4)' }}>
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
