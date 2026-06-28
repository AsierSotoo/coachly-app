'use client'

import { usePathname } from 'next/navigation'

type Team = { id: string; name: string; seasons: { id: string; created_at: string }[] }

export function HeaderTitle({ teams }: { teams: Team[] }) {
  const pathname = usePathname()
  const active = resolveActiveTeam(teams, pathname)
  return (
    <h2 className="text-[20px] font-bold" style={{ color: '#4be277', fontFamily: 'Sora, sans-serif' }}>
      {active?.name ?? 'Mis equipos'}
    </h2>
  )
}

export function resolveActiveTeam(teams: Team[], pathname: string): Team | undefined {
  const teamMatch   = pathname.match(/\/dashboard\/team\/([a-zA-Z0-9_-]+)/)
  const seasonMatch = pathname.match(/\/dashboard\/season\/([a-zA-Z0-9_-]+)/)
  if (teamMatch)   return teams.find(t => t.id === teamMatch[1])   ?? teams[0]
  if (seasonMatch) return teams.find(t => t.seasons?.some(s => s.id === seasonMatch[1])) ?? teams[0]
  return teams[0]
}

export function resolveActiveIds(teams: Team[], pathname: string) {
  const team = resolveActiveTeam(teams, pathname)
  const seasonMatch = pathname.match(/\/dashboard\/season\/([a-zA-Z0-9_-]+)/)
  const seasonId = seasonMatch?.[1]
    ?? team?.seasons?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.id
  return { teamId: team?.id, seasonId }
}
