'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { resolveActiveIds } from './header-title'
import { PwaInstallButton } from './pwa-install-button'

type Team = { id: string; name: string; availability_enabled?: boolean; seasons: { id: string; created_at: string }[] }

interface Props {
  teams: Team[]
  displayName: string
  avatarUrl?: string | null
}

const BASE_NAV = [
  { label: 'Inicio',         icon: 'dashboard',       key: 'home' },
  { label: 'Temporada',      icon: 'calendar_today',  key: 'season' },
  { label: 'Calendario',     icon: 'calendar_month',  key: 'calendar' },
  { label: 'Plantilla',      icon: 'groups',          key: 'players' },
  { label: 'Estadísticas',   icon: 'leaderboard',     key: 'stats' },
  { label: 'Disponibilidad', icon: 'event_available', key: 'disponibilidad' },
  { label: 'Perfil',         icon: 'person',          key: 'profile' },
]

export function DesktopSidebar({ teams, displayName, avatarUrl }: Props) {
  const pathname = usePathname()
  const { teamId, seasonId } = resolveActiveIds(teams, pathname)
  const initial = displayName.charAt(0).toUpperCase()

  const currentTeam = teams.find(t => t.id === teamId)
  const availEnabled = currentTeam?.availability_enabled ?? false
  const NAV = BASE_NAV.filter(item => item.key !== 'disponibilidad' || availEnabled)

  const href = (key: string) => {
    switch (key) {
      case 'home':           return '/dashboard'
      case 'season':         return seasonId ? `/dashboard/season/${seasonId}` : teamId ? `/dashboard/team/${teamId}/seasons` : '/dashboard'
      case 'calendar':       return seasonId ? `/dashboard/season/${seasonId}/calendar` : '/dashboard'
      case 'players':        return teamId ? `/dashboard/team/${teamId}/players` : '/dashboard'
      case 'stats':          return seasonId ? `/dashboard/season/${seasonId}/stats` : '/dashboard'
      case 'disponibilidad': return teamId ? `/dashboard/team/${teamId}/disponibilidad` : '/dashboard'
      case 'profile':        return '/dashboard/profile'
      default:               return '/dashboard'
    }
  }

  const isActive = (key: string) => {
    if (key === 'home')           return pathname === '/dashboard'
    if (key === 'season')         return pathname.startsWith('/dashboard/season') && !pathname.includes('/stats') && !pathname.includes('/convocatoria') && !pathname.includes('/calendar')
    if (key === 'calendar')       return pathname.includes('/calendar')
    if (key === 'players')        return pathname.startsWith('/dashboard/team') && !pathname.includes('/disponibilidad')
    if (key === 'stats')          return pathname.includes('/stats')
    if (key === 'disponibilidad') return pathname.includes('/disponibilidad')
    if (key === 'profile')        return pathname.startsWith('/dashboard/profile')
    return false
  }

  return (
    <aside
      className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 border-r py-7 z-30"
      style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      {/* Logo */}
      <div className="px-5 mb-8 flex items-center gap-3 border-b pb-5" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
          <Image src="/logo.png" alt="Coachly" width={36} height={36} className="w-full h-full object-cover" />
        </div>
        <h1 className="text-[18px] font-extrabold tracking-[-.04em]">
          <span style={{ color: 'rgba(255,255,255,0.92)' }}>Coach</span><span style={{ color: 'var(--accent)' }}>ly</span>
        </h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 overflow-y-auto">
        {NAV.map(({ label, icon, key }) => {
          const active = isActive(key)
          return (
            <Link
              key={key}
              href={href(key)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-all duration-150 cursor-pointer"
              style={{
                color: active ? 'var(--accent)' : 'rgba(255,255,255,0.45)',
                backgroundColor: active ? 'rgba(166,226,42,0.12)' : 'transparent',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)'
                  ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'
                }
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              >
                {icon}
              </span>
              <span className="text-[13px] font-semibold">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* PWA install */}
      <div className="px-4 pb-3">
        <PwaInstallButton />
      </div>

      {/* Profile */}
      <div className="px-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer active:scale-95"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          <div
            className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border"
            style={{ borderColor: 'rgba(166,226,42,0.35)' }}
          >
            {avatarUrl
              ? <Image src={avatarUrl} alt={displayName} fill className="object-cover" unoptimized />
              : <div className="h-full w-full flex items-center justify-center" style={{ background: 'rgba(166,226,42,0.15)' }}>
                  <span className="text-sm font-black" style={{ color: '#a6e22a' }}>{initial}</span>
                </div>
            }
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-[12px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{displayName}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Entrenador</p>
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: 17, color: 'rgba(255,255,255,0.35)' }}>settings</span>
        </Link>
      </div>
    </aside>
  )
}
