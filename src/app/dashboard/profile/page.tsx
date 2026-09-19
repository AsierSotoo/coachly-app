import { createClient } from '@/lib/supabase-server'
import { updateProfile } from './actions'
import { logout } from '@/app/auth/actions'
import { PageTransition } from '@/components/ui/page-transition'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { PwaInstallButton } from '@/components/ui/pwa-install-button'
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
            className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-2xl border border-[#253028] mb-8"
            style={{ backgroundColor: '#111713' }}
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
                  style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#72e697' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified</span>
                  {provider}
                </span>
              </div>
              <p className="text-sm" style={{ color: '#89968e' }}>
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
                style={{ backgroundColor: '#72e697', color: '#07140c', fontFamily: 'Sora, sans-serif' }}
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
              className="rounded-2xl border border-[#253028] p-8 space-y-6"
              style={{ backgroundColor: '#111713' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined" style={{ color: '#72e697' }}>person_outline</span>
                <h4 className="text-[20px] font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Información Personal
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#89968e' }}>
                    Nombre Completo
                  </label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={profile?.name ?? ''}
                    placeholder="Tu nombre como entrenador"
                    className="border rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-[#72e697]"
                    style={{ backgroundColor: '#090e0b', borderColor: '#2a342d', color: '#edf2ee' }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#89968e' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email ?? ''}
                    readOnly
                    className="border rounded-xl px-4 py-3 text-sm outline-none cursor-not-allowed"
                    style={{ backgroundColor: '#090e0b', borderColor: '#2a342d', color: '#89968e', opacity: 0.7 }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#89968e' }}>
                  Club / Organización
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: '#1a231d', color: '#89968e' }}>Próximamente</span>
                </label>
                <input
                  type="text"
                  placeholder="Nombre del club o academia"
                  disabled
                  className="border rounded-xl px-4 py-3 text-sm outline-none cursor-not-allowed"
                  style={{ backgroundColor: '#090e0b', borderColor: '#253028', color: '#89968e', opacity: 0.5 }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#89968e' }}>
                  Número de Teléfono
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: '#1a231d', color: '#89968e' }}>Próximamente</span>
                </label>
                <input
                  type="tel"
                  placeholder="+34 600 000 000"
                  disabled
                  className="border rounded-xl px-4 py-3 text-sm outline-none cursor-not-allowed"
                  style={{ backgroundColor: '#090e0b', borderColor: '#253028', color: '#89968e', opacity: 0.5 }}
                />
              </div>
            </div>

            {/* Plan actual */}
            <div
              className="rounded-2xl border border-[#253028] p-8 flex flex-col gap-6"
              style={{ backgroundColor: '#111713' }}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={{ color: '#72e697' }}>workspace_premium</span>
                <h4 className="text-[20px] font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Plan actual
                </h4>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border" style={{ backgroundColor: '#0b100d', borderColor: 'rgba(34,197,94,0.2)' }}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#72e697' }}>Básico · Gratuito</p>
                  <p className="text-sm" style={{ color: '#89968e' }}>Sin límite de equipos ni jugadoras</p>
                </div>
                <p className="text-[28px] font-extrabold" style={{ color: '#72e697', fontFamily: 'Sora, sans-serif' }}>€0</p>
              </div>

              {[
                'Equipos y plantillas ilimitadas',
                'Registro completo de partidos y estadísticas',
                'Rankings, líderes y rachas',
                'Gestión de convocatorias',
              ].map(feat => (
                <div key={feat} className="flex items-center gap-3">
                  <span className="material-symbols-outlined flex-shrink-0" style={{ color: '#72e697', fontSize: 18 }}>check_circle</span>
                  <p className="text-sm" style={{ color: '#edf2ee' }}>{feat}</p>
                </div>
              ))}
            </div>

          </div>
        </form>

        {/* ── Segunda fila del grid ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">

          {/* Seguridad */}
          <div
            className="rounded-2xl border border-[#253028] p-8 space-y-6"
            style={{ backgroundColor: '#111713' }}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ color: '#72e697' }}>security</span>
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
                <span className="material-symbols-outlined" style={{ color: '#89968e' }}>lock</span>
                <div>
                  <p className="font-semibold text-sm text-white">Cambiar Contraseña</p>
                  <p className="text-xs mt-0.5" style={{ color: '#89968e' }}>Restablece tu contraseña por email</p>
                </div>
              </div>
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-1" style={{ color: '#89968e', fontSize: 20 }}>chevron_right</span>
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
                    <p className="text-xs mt-0.5" style={{ color: '#89968e' }}>Salir de tu cuenta en este dispositivo</p>
                  </div>
                </div>
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1" style={{ color: '#89968e', fontSize: 20 }}>chevron_right</span>
              </button>
            </form>

            {/* 2FA — placeholder */}
            <div className="flex items-center justify-between p-4 -mx-4 rounded-xl opacity-50">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined" style={{ color: '#89968e' }}>fact_check</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-white">Autenticación de dos pasos</p>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: '#1a231d', color: '#89968e' }}>Próximamente</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#89968e' }}>Añade una capa extra de seguridad</p>
                </div>
              </div>
              {/* Toggle visual desactivado */}
              <div className="relative w-11 h-6 rounded-full cursor-not-allowed" style={{ backgroundColor: '#2a342d' }}>
                <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white/30" />
              </div>
            </div>
          </div>

          {/* Instalar app */}
          <div className="rounded-2xl border border-[#253028] p-8 space-y-4" style={{ backgroundColor: '#111713' }}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ color: '#72e697' }}>install_mobile</span>
              <h4 className="text-[20px] font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Instalar Coachly</h4>
            </div>
            <p className="text-sm" style={{ color: '#89968e' }}>
              Añade Coachly a la pantalla de inicio de tu móvil para acceder más rápido, como si fuera una app nativa.
            </p>
            <PwaInstallButton />
            <div className="rounded-xl border border-[#2a342d] p-4 space-y-2" style={{ backgroundColor: '#111713' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#89968e' }}>En iPhone / Safari</p>
              <p className="text-xs" style={{ color: '#637168' }}>
                Toca el botón <strong style={{ color: '#89968e' }}>Compartir</strong> de Safari → <strong style={{ color: '#89968e' }}>Añadir a pantalla de inicio</strong>
              </p>
            </div>
          </div>

          {/* Zona de Peligro */}
          <div
            className="rounded-2xl border p-8 space-y-6"
            style={{ backgroundColor: 'rgba(147,0,10,0.04)', borderColor: 'rgba(255,180,171,0.3)' }}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ color: '#ffb4ab' }}>warning</span>
              <h4 className="text-[20px] font-semibold" style={{ color: '#ffb4ab', fontFamily: 'Sora, sans-serif' }}>
                Zona de Peligro
              </h4>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: '#89968e' }}>
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

            <p className="text-[11px] text-center" style={{ color: '#89968e', opacity: 0.6 }}>
              Función disponible próximamente — contacta soporte para eliminar tu cuenta
            </p>
          </div>

        </div>
      </main>
    </PageTransition>
  )
}
