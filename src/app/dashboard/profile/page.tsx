import { createClient } from '@/lib/supabase-server'
import { updateProfile } from './actions'
import { PageTransition } from '@/components/ui/page-transition'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { ChevronLeft, Mail, Shield } from 'lucide-react'
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

  return (
    <PageTransition>
      <main className="mx-auto max-w-sm px-4 py-6">
        <div className="mb-6">
          <Link href="/dashboard" className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <ChevronLeft className="h-3 w-3" /> Dashboard
          </Link>
          <h1 className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-bold text-white">Mi perfil</h1>
        </div>

        {/* Avatar */}
        <div className="mb-6 flex flex-col items-center rounded-3xl border border-slate-800 bg-slate-900/80 p-8 backdrop-blur">
          <AvatarUpload
            userId={user.id}
            currentUrl={profile?.avatar_url}
            name={displayName}
            size={100}
          />
          <div className="mt-4 text-center">
            <p className="font-[family-name:var(--font-heading)] text-lg font-bold text-white">{displayName}</p>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <Mail className="h-3 w-3" />
              {user.email}
            </div>
          </div>

          {/* Proveedor */}
          <div className="mt-4 flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1">
            <Shield className="h-3 w-3 text-green-400" />
            <span className="text-[10px] font-medium text-slate-400">
              {user.app_metadata?.provider === 'google' ? 'Google' : 'Email'} · Cuenta verificada
            </span>
          </div>
        </div>

        {/* Editar nombre */}
        <form action={updateProfile} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Nombre público
            </label>
            <input
              id="name" name="name" type="text"
              defaultValue={profile?.name ?? ''}
              placeholder="Tu nombre como entrenador"
              className="h-12 px-4 text-sm"
            />
            <p className="text-[11px] text-slate-600">Este nombre aparecerá en el header y en tu perfil público.</p>
          </div>

          {sp.error && (
            <p className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{sp.error}</p>
          )}
          {sp.saved && (
            <p className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
              Perfil actualizado correctamente.
            </p>
          )}

          <button
            type="submit"
            className="flex h-12 items-center justify-center rounded-xl bg-green-500 text-sm font-bold text-white hover:bg-green-400 active:scale-95 transition-all cursor-pointer shadow-lg shadow-green-500/20"
          >
            Guardar cambios
          </button>
        </form>
      </main>
    </PageTransition>
  )
}
