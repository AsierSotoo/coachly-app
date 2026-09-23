import { createClient } from '@/lib/supabase-server'
import { logout } from '@/app/auth/actions'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { NavBar } from '@/components/ui/nav-bar'
import { DesktopSidebar } from '@/components/ui/desktop-sidebar'
import { HeaderTitle } from '@/components/ui/header-title'
import { WhatsNewModal } from '@/components/ui/whats-new-modal'
import { PwaInstallButton } from '@/components/ui/pwa-install-button'
import { ScrollToTop } from '@/components/ui/scroll-to-top'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { getLocale } from '@/lib/i18n'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const [{ data: { user } }, locale] = await Promise.all([
    supabase.auth.getUser(),
    getLocale(),
  ])

  if (!user) redirect('/login')

  const [{ data: profile }, { data: teamsRaw }] = await Promise.all([
    user
      ? supabase.from('users').select('name, avatar_url').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
    user
      ? (supabase.from('teams') as any).select('id, name, availability_enabled, seasons(id, created_at)').order('created_at', { ascending: true })
      : Promise.resolve({ data: null }),
  ])

  const displayName = (profile as { name?: string; avatar_url?: string } | null)?.name || user?.email?.split('@')[0] || 'Entrenador'
  const initial = displayName.charAt(0).toUpperCase()
  const avatarUrl = (profile as { name?: string; avatar_url?: string } | null)?.avatar_url

  type TeamData = { id: string; name: string; availability_enabled: boolean; seasons: { id: string; created_at: string }[] }
  const teams = (teamsRaw ?? []) as TeamData[]

  return (
    <div className="flex min-h-screen">

      {/* Sidebar desktop — recibe todos los equipos, detecta el activo con usePathname */}
      <DesktopSidebar teams={teams} displayName={displayName} avatarUrl={avatarUrl} />

      {/* Columna principal */}
      <div className="flex flex-1 flex-col min-w-0 md:ml-64">

        {/* Header desktop */}
        <header className="sticky top-0 z-20 hidden md:flex items-center justify-between h-16 px-10 border-b" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--bdr-strong)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <HeaderTitle teams={teams} />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageToggle current={locale} />
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
          className="md:hidden sticky top-0 z-20 relative flex items-center justify-between border-b px-4"
          style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--bdr-strong)', height: 'calc(56px + env(safe-area-inset-top, 0px))', paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          {/* Izquierda: solo el icono */}
          <Link href="/dashboard" className="flex items-center justify-center flex-shrink-0 active:opacity-70 transition-opacity">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <Image src="/logo.png" alt="Coachly" width={32} height={32} className="w-full h-full object-cover" />
            </div>
          </Link>

          {/* Centro: título absoluto */}
          <span
            className="absolute left-1/2 -translate-x-1/2 font-extrabold text-[17px] leading-none pointer-events-none select-none"
            style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}
          >
            Coach<span style={{ color: 'var(--accent)' }}>ly</span>
          </span>

          {/* Derecha: toggle + avatar */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <ThemeToggle compact />
            <Link href="/dashboard/profile"
              className="flex items-center justify-center rounded-full overflow-hidden border active:opacity-70 transition-opacity"
              style={{ width: 34, height: 34, borderColor: 'var(--bdr-strong)' }}>
              {avatarUrl
                ? <Image src={avatarUrl} alt={displayName} width={34} height={34} className="object-cover" unoptimized />
                : <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-500 to-green-700">
                    <span className="font-black text-sm text-white">{initial}</span>
                  </div>
              }
            </Link>
          </div>
        </header>

        <div className="flex-1 pb-24 md:pb-0">{children}</div>
        <WhatsNewModal />
        <ScrollToTop />

        {/* Nav inferior móvil */}
        <NavBar teams={teams} />
      </div>
    </div>
  )
}
