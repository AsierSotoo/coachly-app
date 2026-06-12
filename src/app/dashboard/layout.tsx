import { createClient } from '@/lib/supabase-server'
import { logout } from '@/app/auth/actions'
import Link from 'next/link'
import Image from 'next/image'
import { Home, Users, LogOut, UserCircle } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('users').select('name, avatar_url').eq('id', user.id).single()
    : { data: null }

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Entrenador'
  const initial = displayName.charAt(0).toUpperCase()
  const avatarUrl = profile?.avatar_url

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#020617' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800/80 bg-[#020617]/90 backdrop-blur-md px-4 py-3">
        <Link href="/dashboard" className="font-[family-name:var(--font-heading)] text-lg font-bold text-green-400 tracking-tight hover:text-green-300 transition-colors">
          Coachly
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 hover:border-slate-700 transition-colors cursor-pointer"
          >
            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-green-500 to-green-700">
              {avatarUrl
                ? <Image src={avatarUrl} alt={displayName} fill className="object-cover" unoptimized />
                : <span className="font-[family-name:var(--font-heading)] text-[10px] font-black text-white">{initial}</span>
              }
            </div>
            <span className="hidden text-xs font-medium text-slate-300 sm:block max-w-[120px] truncate">{displayName}</span>
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </header>

      {/* Contenido */}
      <div className="flex-1 pb-20">
        {children}
      </div>

      {/* Nav inferior */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-slate-800/80 bg-[#020617]/90 backdrop-blur-md">
        <Link href="/dashboard" className="flex flex-1 flex-col items-center gap-1 py-3 text-slate-500 hover:text-green-400 transition-colors cursor-pointer group">
          <Home className="h-5 w-5 transition-transform group-hover:scale-110" />
          <span className="text-[10px] font-medium">Inicio</span>
        </Link>
        <Link href="/dashboard/team/new" className="flex flex-1 flex-col items-center gap-1 py-3 text-slate-500 hover:text-green-400 transition-colors cursor-pointer group">
          <Users className="h-5 w-5 transition-transform group-hover:scale-110" />
          <span className="text-[10px] font-medium">Equipo</span>
        </Link>
        <Link href="/dashboard/profile" className="flex flex-1 flex-col items-center gap-1 py-3 text-slate-500 hover:text-green-400 transition-colors cursor-pointer group">
          <UserCircle className="h-5 w-5 transition-transform group-hover:scale-110" />
          <span className="text-[10px] font-medium">Perfil</span>
        </Link>
      </nav>
    </div>
  )
}
