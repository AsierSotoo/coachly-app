'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useRef } from 'react'
import { resolveActiveIds } from './header-title'

type Team = { id: string; name: string; seasons: { id: string; created_at: string }[] }

export function HeaderSearch({ teams }: { teams: Team[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const inputRef = useRef<HTMLInputElement>(null)
  const { teamId } = resolveActiveIds(teams, pathname)
  const playersHref = teamId ? `/dashboard/team/${teamId}/players` : '/dashboard'

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const q = inputRef.current?.value.trim()
      router.push(q ? `${playersHref}?q=${encodeURIComponent(q)}` : playersHref)
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-full px-4 py-1.5 border border-[#2a342d] focus-within:border-[#72e697] transition-colors"
      style={{ backgroundColor: '#1a231d' }}>
      <span className="material-symbols-outlined" style={{ color: '#89968e', fontSize: 16 }}>search</span>
      <input
        ref={inputRef}
        placeholder="Buscar jugador/a..."
        onKeyDown={handleKeyDown}
        className="bg-transparent border-none focus:ring-0 text-sm w-36"
        style={{ color: '#edf2ee', outline: 'none', fontSize: '14px', padding: 0, minHeight: 'auto' }}
      />
    </div>
  )
}
