import { createClient } from '@/lib/supabase-server'
import { updateProfile } from './actions'
import { PageTransition } from '@/components/ui/page-transition'
import { ChevronLeft } from 'lucide-react'
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

  return (
    <PageTransition>
      <main className="mx-auto max-w-sm px-4 py-8">
        <div className="mb-8">
          <Link href="/dashboard" className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <ChevronLeft className="h-3 w-3" /> Dashboard
          </Link>
          <h1 className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-bold text-white">Mi perfil</h1>
        </div>

        {/* Avatar */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-green-500 to-green-700 shadow-xl shadow-green-500/20">
            <span className="font-[family-name:var(--font-heading)] text-3xl font-black text-white">
              {(profile?.name ?? user.email ?? '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="text-center">
            <p className="font-semibold text-white">{profile?.name ?? 'Sin nombre'}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>

        <form action={updateProfile} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Nombre del entrenador
            </label>
            <input
              id="name" name="name" type="text"
              defaultValue={profile?.name ?? ''}
              placeholder="Tu nombre completo"
              className="h-12 px-4 text-sm"
            />
          </div>

          {sp.error && <p className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{sp.error}</p>}
          {sp.saved && <p className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">Perfil actualizado.</p>}

          <button type="submit" className="flex h-12 items-center justify-center rounded-xl bg-green-500 text-sm font-bold text-white hover:bg-green-400 active:scale-95 transition-all cursor-pointer shadow-lg shadow-green-500/20">
            Guardar
          </button>
        </form>
      </main>
    </PageTransition>
  )
}
