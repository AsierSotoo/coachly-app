import { createClient } from '@/lib/supabase-server'
import { updateProfile } from './actions'
import { logout } from '@/app/auth/actions'
import { PageTransition } from '@/components/ui/page-transition'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('*').eq('id', user.id).single()

  const sp = await searchParams
  const displayName = profile?.name || user.email?.split('@')[0] || 'Entrenador'
  const provider = user.app_metadata?.provider === 'google' ? 'Google' : 'Email'

  return (
    <PageTransition>
      <main className="max-w-6xl mx-auto px-4 md:px-10 py-8 pb-32 md:pb-10">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <form action={updateProfile}>
          <section
            className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-[24px] border border-[#1e293b] mb-8"
            style={{ backgroundColor: '#0f172a' }}
          >
            {/* Avatar */}
            <AvatarUpload
              userId={user.id}
              currentUrl={profile?.avatar_url}
              name={displayName}
              size={112}
            />

            {/* Nombre + badge */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h3 className="text-[32px] font-extrabold leading-tight text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {displayName}
                </h3>
                <span
                  className="flex items-center gap-1 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-widest"
                  style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#4be277' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified</span>
                  {provider}
                </span>
              </div>
              <p className="text-sm" style={{ color: '#adb4ce' }}>
                {user.email}
              </p>
            </div>

            {/* Botón guardar */}
            <div className="md:ml-auto flex-shrink-0">
              {sp.saved && (
                <p className="mb-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm text-green-400 text-center">
                  Guardado correctamente
                </p>
              )}
              {sp.error && (
                <p className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400 text-center">
                  {sp.error}
                </p>
              )}
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm active:scale-95 transition-all cursor-pointer"
                style={{ backgroundColor: '#22c55e', color: '#003915', fontFamily: 'Sora, sans-serif' }}
              >
                <span className="material-symbols-outlined text-lg">save</span>
                Guardar Cambios
              </button>
            </div>
          </section>

          {/* ── Grid 2 columnas ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Información Personal */}
            <div
              className="rounded-[24px] border border-[#1e293b] p-8 space-y-6"
              style={{ backgroundColor: '#0f172a' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined" style={{ color: '#4be277' }}>person_outline</span>
                <h4 className="text-[20px] font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Información Personal
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>
                    Nombre Completo
                  </label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={profile?.name ?? ''}
                    placeholder="Tu nombre como entrenador"
                    className="border rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-[#4be277]"
                    style={{ backgroundColor: '#0c1324', borderColor: '#2e3447', color: '#dce1fb' }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email ?? ''}
                    readOnly
                    className="border rounded-xl px-4 py-3 text-sm outline-none cursor-not-allowed"
                    style={{ backgroundColor: '#0c1324', borderColor: '#2e3447', color: '#adb4ce', opacity: 0.7 }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#adb4ce' }}>
                  Club / Organización
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: '#23293c', color: '#adb4ce' }}>Próximamente</span>
                </label>
                <input
                  type="text"
                  placeholder="Nombre del club o academia"
                  disabled
                  className="border rounded-xl px-4 py-3 text-sm outline-none cursor-not-allowed"
                  style={{ backgroundColor: '#0c1324', borderColor: '#1e293b', color: '#adb4ce', opacity: 0.5 }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#adb4ce' }}>
                  Número de Teléfono
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: '#23293c', color: '#adb4ce' }}>Próximamente</span>
                </label>
                <input
                  type="tel"
                  placeholder="+34 600 000 000"
                  disabled
                  className="border rounded-xl px-4 py-3 text-sm outline-none cursor-not-allowed"
                  style={{ backgroundColor: '#0c1324', borderColor: '#1e293b', color: '#adb4ce', opacity: 0.5 }}
                />
              </div>
            </div>

            {/* Plan actual */}
            <div
              className="rounded-[24px] border border-[#1e293b] p-8 flex flex-col gap-6"
              style={{ backgroundColor: '#0f172a' }}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={{ color: '#4be277' }}>workspace_premium</span>
                <h4 className="text-[20px] font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Plan actual
                </h4>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border" style={{ backgroundColor: '#070d1f', borderColor: 'rgba(34,197,94,0.2)' }}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#4be277' }}>Básico · Gratuito</p>
                  <p className="text-sm" style={{ color: '#adb4ce' }}>Sin límite de equipos ni jugadoras</p>
                </div>
                <p className="text-[28px] font-extrabold" style={{ color: '#4be277', fontFamily: 'Sora, sans-serif' }}>€0</p>
              </div>

              {[
                'Equipos y plantillas ilimitadas',
                'Registro completo de partidos y estadísticas',
                'Rankings, líderes y rachas',
                'Gestión de convocatorias',
              ].map(feat => (
                <div key={feat} className="flex items-center gap-3">
                  <span className="material-symbols-outlined flex-shrink-0" style={{ color: '#4be277', fontSize: 18 }}>check_circle</span>
                  <p className="text-sm" style={{ color: '#dce1fb' }}>{feat}</p>
                </div>
              ))}
            </div>

          </div>
        </form>

        {/* ── Segunda fila del grid ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">

          {/* Seguridad */}
          <div
            className="rounded-[24px] border border-[#1e293b] p-8 space-y-6"
            style={{ backgroundColor: '#0f172a' }}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ color: '#4be277' }}>security</span>
              <h4 className="text-[20px] font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                Seguridad
              </h4>
            </div>

            {/* Cambiar contraseña */}
            <Link
              href="/forgot-password"
              className="flex items-center justify-between p-4 -mx-4 rounded-xl transition-colors group hover:bg-slate-800/30"
            >
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined" style={{ color: '#adb4ce' }}>lock</span>
                <div>
                  <p className="font-semibold text-sm text-white">Cambiar Contraseña</p>
                  <p className="text-xs mt-0.5" style={{ color: '#adb4ce' }}>Restablece tu contraseña por email</p>
                </div>
              </div>
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-1" style={{ color: '#adb4ce', fontSize: 20 }}>chevron_right</span>
            </Link>

            {/* Cerrar sesión */}
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center justify-between p-4 -mx-4 rounded-xl w-full transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined" style={{ color: '#ffb4ab' }}>logout</span>
                  <div className="text-left">
                    <p className="font-semibold text-sm text-white">Cerrar Sesión</p>
                    <p className="text-xs mt-0.5" style={{ color: '#adb4ce' }}>Salir de tu cuenta en este dispositivo</p>
                  </div>
                </div>
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1" style={{ color: '#adb4ce', fontSize: 20 }}>chevron_right</span>
              </button>
            </form>

            {/* 2FA — placeholder */}
            <div className="flex items-center justify-between p-4 -mx-4 rounded-xl opacity-50">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined" style={{ color: '#adb4ce' }}>fact_check</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-white">Autenticación de dos pasos</p>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: '#23293c', color: '#adb4ce' }}>Próximamente</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#adb4ce' }}>Añade una capa extra de seguridad</p>
                </div>
              </div>
              {/* Toggle visual desactivado */}
              <div className="relative w-11 h-6 rounded-full cursor-not-allowed" style={{ backgroundColor: '#2e3447' }}>
                <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white/30" />
              </div>
            </div>
          </div>

          {/* Zona de Peligro */}
          <div
            className="rounded-[24px] border p-8 space-y-6"
            style={{ backgroundColor: 'rgba(147,0,10,0.04)', borderColor: 'rgba(255,180,171,0.3)' }}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ color: '#ffb4ab' }}>warning</span>
              <h4 className="text-[20px] font-semibold" style={{ color: '#ffb4ab', fontFamily: 'Sora, sans-serif' }}>
                Zona de Peligro
              </h4>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: '#adb4ce' }}>
              Al eliminar tu cuenta, todos los equipos, jugadoras, temporadas y estadísticas
              registradas se perderán permanentemente. Esta acción no se puede deshacer.
            </p>

            <button
              type="button"
              disabled
              className="w-full py-3 rounded-xl font-bold text-sm border cursor-not-allowed opacity-60 transition-colors"
              style={{
                borderColor: 'rgba(255,180,171,0.5)',
                color: '#ffb4ab',
                fontFamily: 'Sora, sans-serif',
              }}
            >
              Eliminar Cuenta Definitivamente
            </button>

            <p className="text-[11px] text-center" style={{ color: '#adb4ce', opacity: 0.6 }}>
              Función disponible próximamente — contacta soporte para eliminar tu cuenta
            </p>
          </div>

        </div>
      </main>
    </PageTransition>
  )
}
