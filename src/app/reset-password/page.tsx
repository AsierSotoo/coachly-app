import Link from 'next/link'
import { updatePassword } from '@/app/auth/actions'

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#020617' }}>

      {/* Logo */}
      <Link href="/" className="mb-8 flex flex-col items-center gap-2 group">
        <div className="w-14 h-14 rounded-2xl overflow-hidden transition-transform group-hover:scale-105 shadow-lg shadow-green-500/20">
          <img src="/logo.png" alt="Coachly" className="w-full h-full object-cover" />
        </div>
        <span className="text-sm font-bold" style={{ color: 'var(--accent)', fontFamily: 'Sora, sans-serif' }}>Coachly</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border border-[#253028] p-8"
        style={{ backgroundColor: '#111713' }}>

        <div className="mb-6 text-center">
          <span className="material-symbols-outlined mb-3 block" style={{ color: 'var(--accent)', fontSize: 36, fontVariationSettings: "'FILL' 1" }}>
            lock
          </span>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
            Nueva contraseña
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#89968e' }}>
            Elige una contraseña de al menos 6 caracteres.
          </p>
        </div>

        <FormContent searchParams={searchParams} />
      </div>
    </div>
  )
}

async function FormContent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <form action={updatePassword} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#89968e' }}>
          Nueva contraseña
        </label>
        <input id="password" name="password" type="password" required
          minLength={6} placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          className="rounded-xl px-4 text-sm"
          style={{ minHeight: 44 }}
        />
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm" style={{ color: '#ffb4ab' }}>
          {error}
        </p>
      )}

      <button type="submit"
        className="flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
        style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)', minHeight: 44, boxShadow: '0 0 12px rgba(34,197,94,0.2)' }}>
        <span className="material-symbols-outlined text-lg">save</span>
        Guardar contraseña
      </button>
    </form>
  )
}
