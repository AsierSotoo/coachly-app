import Link from 'next/link'
import Image from 'next/image'
import { login, signInWithGoogle } from '@/app/auth/actions'

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
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

        {/* Overlay cinematográfico */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/92" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black/50 to-transparent" />

        {/* Logo arriba */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-lg shadow-black/30">
              <Image src="/logo.png" alt="Coachly" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <span className="font-[family-name:var(--font-heading)] text-xl font-bold text-white tracking-tight">
              Coachly
            </span>
          </div>
        </div>

        {/* Texto inferior */}
        <div className="relative z-10 px-10 pb-12">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: '#4ade80' }}>
            Para entrenadores de fútbol
          </p>
          <h2 className="text-[42px] font-black text-white leading-[1.05] tracking-tight">
            Cada minuto.<br />Cada gol.<br />Cada tarjeta.
          </h2>
          <p className="mt-4 text-sm leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Registra tus partidos en minutos y deja que los números hablen solos.
          </p>

          {/* Separador */}
          <div className="mt-8 h-px w-10 bg-green-500/50" />

          {/* Feature pills con iconos */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: 'bar_chart', label: 'Estadísticas', desc: 'goles, asist. y tarjetas' },
              { icon: 'groups', label: 'Plantilla', desc: 'fotos y posiciones' },
              { icon: 'local_fire_department', label: 'Rachas', desc: 'últimos 5 partidos' },
            ].map(f => (
              <div key={f.label}
                className="flex flex-col gap-2 rounded-xl p-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.2)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#4ade80' }}>{f.icon}</span>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-white">{f.label}</p>
                  <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.35)' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-14 relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse 90% 60% at 50% -5%, rgba(34,197,94,0.07) 0%, transparent 65%), #020617' }}>

        {/* Dot grid sutil */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative z-10 w-full max-w-[340px]">

          {/* Hero móvil */}
          <div className="mb-10 lg:hidden">
            <div className="relative overflow-hidden rounded-2xl border p-6 text-center" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(34,197,94,0.06) 100%)' }}>
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/60 to-transparent" />
              <div className="relative flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-green-500/20">
                  <Image src="/logo.png" alt="Coachly" width={56} height={56} className="w-full h-full object-cover" />
                </div>
                <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-green-400 tracking-tight">Coachly</span>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Estadísticas para entrenadores</p>
              </div>
            </div>
          </div>

          {/* Cabecera */}
          <div className="mb-7">
            <h1 className="text-[26px] font-black text-white tracking-tight">Accede a tu cuenta</h1>
            <p className="mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Tu equipo te está esperando</p>
          </div>

          {/* Google — CTA principal */}
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-xl h-12 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff' }}
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <span className="text-[11px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.25)' }}>o</span>
            <div className="h-px flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Email/pass */}
          <form action={login} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Email</label>
              <input
                id="email" name="email" type="email" required
                autoComplete="email" placeholder="tu@email.com"
                className="h-11 px-4 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Contraseña</label>
                <Link href="/forgot-password" className="text-[11px] hover:text-green-400 transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}>¿Olvidaste la contraseña?</Link>
              </div>
              <input
                id="password" name="password" type="password" required
                autoComplete="current-password" placeholder="••••••••"
                className="h-11 px-4 text-sm"
              />
            </div>

            <ErrorMessage searchParams={searchParams} />

            <button
              type="submit"
              className="mt-1 flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: '#16a34a', boxShadow: '0 0 0 1px rgba(74,222,128,0.2), 0 4px 20px rgba(22,163,74,0.35)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              Entrar
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            ¿Sin cuenta?{' '}
            <Link href="/register" className="font-bold text-green-400 hover:text-green-300 transition-colors">
              Regístrate gratis
            </Link>
          </p>
          <p className="mt-2 text-center text-[11px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
            Sin tarjeta de crédito · Gratis para empezar
          </p>
        </div>
      </div>
    </div>
  )
}

async function ErrorMessage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  if (!error) return null
  return (
    <p className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</p>
  )
}
