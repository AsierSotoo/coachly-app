import Link from 'next/link'
import { requestPasswordReset } from '@/app/auth/actions'

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#020617' }}>

      {/* Logo */}
      <Link href="/" className="mb-8 flex flex-col items-center gap-2 group">
        <div className="w-14 h-14 rounded-2xl overflow-hidden transition-transform group-hover:scale-105 shadow-lg shadow-green-500/20">
          <img src="/logo.png" alt="Coachly" className="w-full h-full object-cover" />
        </div>
        <span className="text-sm font-bold" style={{ color: '#4be277', fontFamily: 'Sora, sans-serif' }}>Coachly</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border border-[#1e293b] p-8"
        style={{ backgroundColor: '#0f172a' }}>

        <div className="mb-6 text-center">
          <span className="material-symbols-outlined mb-3 block" style={{ color: '#4be277', fontSize: 36 }}>lock_reset</span>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
            Recuperar contraseña
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#adb4ce' }}>
            Te enviaremos un enlace a tu email.
          </p>
        </div>

        <FeedbackContent searchParams={searchParams} />
      </div>
    </div>
  )
}

async function FeedbackContent({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const sp = await searchParams

  if (sp.sent) {
    return (
      <div className="flex flex-col items-center text-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}>
          <span className="material-symbols-outlined" style={{ color: '#4be277', fontSize: 32, fontVariationSettings: "'FILL' 1" }}>
            mark_email_read
          </span>
        </div>
        <div>
          <p className="font-semibold text-white">Revisa tu bandeja de entrada</p>
          <p className="mt-1 text-sm" style={{ color: '#adb4ce' }}>
            Si el email existe, recibirás el enlace en breve.
          </p>
        </div>
        <Link href="/login"
          className="mt-2 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all active:scale-95 w-full"
          style={{ backgroundColor: '#22c55e', color: '#003915', minHeight: 44 }}>
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Volver al login
        </Link>
      </div>
    )
  }

  return (
    <form action={requestPasswordReset} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>
          Email
        </label>
        <input id="email" name="email" type="email" required
          autoComplete="email" placeholder="tu@email.com"
          className="rounded-xl px-4 text-sm"
          style={{ minHeight: 44 }}
        />
      </div>

      {sp.error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm" style={{ color: '#ffb4ab' }}>
          {sp.error}
        </p>
      )}

      <button type="submit"
        className="flex items-center justify-center rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
        style={{ backgroundColor: '#22c55e', color: '#003915', minHeight: 44, boxShadow: '0 0 12px rgba(34,197,94,0.2)' }}>
        Enviar enlace
      </button>

      <Link href="/login" className="text-center text-xs transition-colors hover:underline" style={{ color: '#adb4ce' }}>
        ← Volver al login
      </Link>
    </form>
  )
}
