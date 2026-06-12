import { createClient } from '@/lib/supabase-server'
import { logout } from '@/app/auth/actions'
import Link from 'next/link'
import { Home, Users, LogOut } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#020617' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800/80 bg-[#020617]/90 backdrop-blur-md px-4 py-3">
        <Link href="/dashboard" className="font-[family-name:var(--font-heading)] text-lg font-bold text-green-400 tracking-tight hover:text-green-300 transition-colors">
          Coachly
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-slate-500 sm:block truncate max-w-[180px]">{user?.email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Salir
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
        <Link
          href="/dashboard"
          className="flex flex-1 flex-col items-center gap-1 py-3 text-slate-500 hover:text-green-400 transition-colors cursor-pointer group"
        >
          <Home className="h-5 w-5 transition-transform group-hover:scale-110" />
          <span className="text-[10px] font-medium">Inicio</span>
        </Link>
        <Link
          href="/dashboard/team/new"
          className="flex flex-1 flex-col items-center gap-1 py-3 text-slate-500 hover:text-green-400 transition-colors cursor-pointer group"
        >
          <Users className="h-5 w-5 transition-transform group-hover:scale-110" />
          <span className="text-[10px] font-medium">Equipo</span>
        </Link>
      </nav>
    </div>
  )
}
