'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Glass } from '@samasante/liquid-glass'
import { resolveActiveIds } from './header-title'

type Team = { id: string; name: string; availability_enabled?: boolean; seasons: { id: string; created_at: string }[] }

export function NavBar({ teams }: { teams: Team[] }) {
  const pathname = usePathname()
  const { teamId, seasonId } = resolveActiveIds(teams, pathname)

  const currentTeam = teams.find(t => t.id === teamId)
  const availEnabled = currentTeam?.availability_enabled ?? false

  const allItems = [
    { key: 'home',           href: '/dashboard',                                                                                    icon: 'home',            label: 'Inicio' },
    { key: 'season',         href: seasonId ? `/dashboard/season/${seasonId}` : teamId ? `/dashboard/team/${teamId}/seasons` : '/dashboard', icon: 'calendar_today',  label: 'Temporada' },
    { key: 'stats',          href: seasonId ? `/dashboard/season/${seasonId}/stats` : '/dashboard',                              icon: 'leaderboard',     label: 'Stats' },
    { key: 'disponibilidad', href: teamId ? `/dashboard/team/${teamId}/disponibilidad` : '/dashboard',                           icon: 'event_available', label: 'Disponib.' },
    { key: 'profile',        href: '/dashboard/profile',                                                                         icon: 'person',          label: 'Perfil' },
  ]
  const items = allItems.filter(item => item.key !== 'disponibilidad' || availEnabled)

  const isActive = (key: string) => {
    if (key === 'home')          return pathname === '/dashboard'
    if (key === 'season')        return pathname.startsWith('/dashboard/season') && !pathname.includes('/stats') && !pathname.includes('/calendar')
    if (key === 'stats')         return pathname.includes('/stats')
    if (key === 'disponibilidad')return pathname.includes('/disponibilidad')
    if (key === 'profile')       return pathname.startsWith('/dashboard/profile')
    return false
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-20"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <Glass
        style={{ width: '100%', borderRadius: 0 }}
        height={64}
        live
        optics={{
          frost: 3,
          strength: 0.55,
          depth: 0.6,
          bend: 0.35,
          bendWidth: 0.12,
          sheen: 0.4,
          brightness: 0.95,
          glow: 0.1,
        }}
      >
        <div className="flex items-center h-16">
          {items.map(item => {
            const active = isActive(item.key)
            return (
              <Link key={item.key} href={item.href}
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 h-full transition-all active:scale-90 active:opacity-70"
                style={{ color: active ? 'var(--accent)' : 'var(--tx-3)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: active ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400" }}>
                  {item.icon}
                </span>
                <span className="text-[10px] font-semibold leading-none">{item.label}</span>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                )}
              </Link>
            )
          })}
        </div>
      </Glass>
    </nav>
  )
}
