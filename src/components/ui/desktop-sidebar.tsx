'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { resolveActiveIds } from './header-title'
import { PwaInstallButton } from './pwa-install-button'

type Team = { id: string; name: string; seasons: { id: string; created_at: string }[] }

interface Props {
  teams: Team[]
  displayName: string
  avatarUrl?: string | null
}

const NAV = [
  { label: 'Inicio',          icon: 'dashboard',       key: 'home' },
  { label: 'Temporada',       icon: 'calendar_today',  key: 'season' },
  { label: 'Calendario',      icon: 'calendar_month',  key: 'calendar' },
  { label: 'Plantilla',       icon: 'groups',          key: 'players' },
  { label: 'Estadísticas',    icon: 'leaderboard',     key: 'stats' },
  { label: 'Disponibilidad',  icon: 'event_available', key: 'disponibilidad' },
  { label: 'Perfil',          icon: 'person',          key: 'profile' },
]

export function DesktopSidebar({ teams, displayName, avatarUrl }: Props) {
  const pathname = usePathname()
  const { teamId, seasonId } = resolveActiveIds(teams, pathname)
  const initial = displayName.charAt(0).toUpperCase()

  const href = (key: string) => {
    switch (key) {
      case 'home':    return '/dashboard'
      case 'season':          return seasonId ? `/dashboard/season/${seasonId}` : teamId ? `/dashboard/team/${teamId}/seasons` : '/dashboard'
      case 'calendar':        return seasonId ? `/dashboard/season/${seasonId}/calendar` : '/dashboard'
      case 'players':         return teamId ? `/dashboard/team/${teamId}/players` : '/dashboard'
      case 'stats':           return seasonId ? `/dashboard/season/${seasonId}/stats` : '/dashboard'
      case 'disponibilidad':  return teamId ? `/dashboard/team/${teamId}/disponibilidad` : '/dashboard'
      case 'profile':         return '/dashboard/profile'
      default:        return '/dashboard'
    }
  }

  const isActive = (key: string) => {
    if (key === 'home')    return pathname === '/dashboard'
    if (key === 'season')          return pathname.startsWith('/dashboard/season') && !pathname.includes('/stats') && !pathname.includes('/convocatoria') && !pathname.includes('/calendar')
    if (key === 'calendar')        return pathname.includes('/calendar')
    if (key === 'players')         return pathname.startsWith('/dashboard/team') && !pathname.includes('/disponibilidad')
    if (key === 'stats')           return pathname.includes('/stats')
    if (key === 'disponibilidad')  return pathname.includes('/disponibilidad')
    if (key === 'profile')         return pathname.startsWith('/dashboard/profile')
    return false
  }

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 border-r border-[#2e3447] py-8 z-30" style={{ backgroundColor: '#151b2d' }}>

      {/* Logo */}
      <div className="px-4 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
          <Image src="/logo.png" alt="Coachly" width={40} height={40} className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-[20px] font-extrabold leading-tight" style={{ color: '#4be277', fontFamily: 'Sora, sans-serif' }}>Coachly</h1>
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#adb4ce', opacity: 0.7 }}>Análisis Técnico</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2">
        {NAV.map(({ label, icon, key }) => {
          const active = isActive(key)
          return (
            <Link key={key} href={href(key)}
              className="flex items-center gap-3 px-4 py-3 rounded-none transition-all duration-200 cursor-pointer group"
              style={{
                color: active ? '#4be277' : '#adb4ce',
                backgroundColor: active ? 'rgba(75,226,119,0.07)' : 'transparent',
                borderRight: active ? '2px solid #4be277' : '2px solid transparent',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
              <span className="text-[12px] font-semibold uppercase tracking-[0.05em]">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* PWA install */}
      <div className="px-4 pb-3">
        <PwaInstallButton />
      </div>

      {/* Profile */}
      <div className="px-4 pt-4 border-t border-[#2e3447]/50">
        <Link href="/dashboard/profile"
          className="flex items-center gap-3 p-2 rounded-xl transition-colors cursor-pointer active:scale-95"
          style={{ backgroundColor: '#23293c' }}>
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border" style={{ borderColor: 'rgba(75,226,119,0.2)' }}>
            {avatarUrl
              ? <Image src={avatarUrl} alt={displayName} fill className="object-cover" unoptimized />
              : <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700">
                  <span className="text-sm font-black text-white">{initial}</span>
                </div>
            }
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-[12px] font-semibold truncate" style={{ color: '#dce1fb' }}>{displayName}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#4be277' }}>Entrenador</p>
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#adb4ce' }}>settings</span>
        </Link>
      </div>
    </aside>
  )
}
