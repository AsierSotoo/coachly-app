import { createClient } from '@/lib/supabase-server'
import { logout } from '@/app/auth/actions'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { NavBar } from '@/components/ui/nav-bar'
import { DesktopSidebar } from '@/components/ui/desktop-sidebar'
import { HeaderSearch } from '@/components/ui/header-search'
import { HeaderTitle } from '@/components/ui/header-title'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: teamsRaw }] = await Promise.all([
    user
      ? supabase.from('users').select('name, avatar_url').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
    user
      ? supabase.from('teams').select('id, name, seasons(id, created_at)').order('created_at', { ascending: true })
      : Promise.resolve({ data: null }),
  ])

  const displayName = (profile as { name?: string; avatar_url?: string } | null)?.name || user?.email?.split('@')[0] || 'Entrenador'
  const initial = displayName.charAt(0).toUpperCase()
  const avatarUrl = (profile as { name?: string; avatar_url?: string } | null)?.avatar_url

  type TeamData = { id: string; name: string; seasons: { id: string; created_at: string }[] }
  const teams = (teamsRaw ?? []) as TeamData[]

  return (
    <div className="flex min-h-screen">

      {/* Sidebar desktop — recibe todos los equipos, detecta el activo con usePathname */}
      <DesktopSidebar teams={teams} displayName={displayName} avatarUrl={avatarUrl} />

      {/* Columna principal */}
      <div className="flex flex-1 flex-col min-w-0 md:ml-64">

        {/* Header desktop */}
        <header className="sticky top-0 z-20 hidden md:flex items-center justify-between h-16 px-10 border-b border-[#2e3447]" style={{ backgroundColor: '#0c1324' }}>
          <HeaderTitle teams={teams} />
          <div className="flex items-center gap-4">
            <HeaderSearch teams={teams} />
            <Link href="/dashboard/profile" className="flex items-center gap-2 cursor-pointer">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-green-500/20">
                {avatarUrl
                  ? <Image src={avatarUrl} alt={displayName} fill className="object-cover" unoptimized />
                  : <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700">
                      <span className="text-xs font-black text-white">{initial}</span>
                    </div>
                }
              </div>
            </Link>
          </div>
        </header>

        {/* Header móvil */}
        <header
          className="md:hidden sticky top-0 z-20 flex items-center justify-between border-b border-[#2e3447] px-4"
          style={{ backgroundColor: '#0c1324', height: 56, paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
              <Image src="/logo.png" alt="Coachly" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-lg leading-none" style={{ color: '#4be277', fontFamily: 'Sora, sans-serif' }}>Coachly</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/profile"
              className="flex items-center justify-center rounded-full overflow-hidden border border-[#2e3447] active:opacity-70 transition-opacity"
              style={{ width: 40, height: 40 }}>
              {avatarUrl
                ? <Image src={avatarUrl} alt={displayName} width={40} height={40} className="object-cover" unoptimized />
                : <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-500 to-green-700">
                    <span className="font-black text-sm text-white">{initial}</span>
                  </div>
              }
            </Link>
            <form action={logout}>
              <button type="submit"
                className="flex items-center justify-center rounded-xl border border-[#2e3447] active:opacity-70 transition-opacity"
                style={{ width: 40, height: 40, backgroundColor: '#151b2d', color: '#adb4ce' }}
                aria-label="Cerrar sesión">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
              </button>
            </form>
          </div>
        </header>

        <div className="flex-1 pb-24 md:pb-0">{children}</div>

        {/* Nav inferior móvil */}
        <NavBar teams={teams} />
      </div>
    </div>
  )
}
