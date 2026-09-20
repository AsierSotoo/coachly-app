import Image from 'next/image'
import { cn } from '@/lib/utils'

const POSITION_STYLES: Record<string, { bg: string; color: string }> = {
  Portera:        { bg: 'rgba(251,191,36,0.18)',  color: '#fbbf24' },
  Portero:        { bg: 'rgba(251,191,36,0.18)',  color: '#fbbf24' },
  Defensa:        { bg: 'rgba(96,165,250,0.18)',  color: '#60a5fa' },
  Centrocampista: { bg: 'rgba(var(--accent-rgb),0.18)', color: 'var(--accent)' },
  Delantera:      { bg: 'rgba(248,113,113,0.18)', color: '#f87171' },
  Delantero:      { bg: 'rgba(248,113,113,0.18)', color: '#f87171' },
}
const DEFAULT_STYLE = { bg: 'rgba(148,163,184,0.12)', color: '#89968e' }

interface PlayerAvatarProps {
  name: string
  photoUrl?: string | null
  position?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PlayerAvatar({ name, photoUrl, position, size = 'md', className }: PlayerAvatarProps) {
  const dims = { sm: 'h-9 w-9 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-14 w-14 text-base' }
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const s = position ? (POSITION_STYLES[position] ?? DEFAULT_STYLE) : DEFAULT_STYLE

  return (
    <div
      className={cn('relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl', dims[size], className)}
      style={!photoUrl ? { backgroundColor: s.bg } : undefined}
    >
      {photoUrl ? (
        <Image src={photoUrl} alt={name} fill className="object-cover" unoptimized />
      ) : (
        <span className="font-[family-name:var(--font-heading)] font-black" style={{ color: s.color }}>
          {initials}
        </span>
      )}
    </div>
  )
}
