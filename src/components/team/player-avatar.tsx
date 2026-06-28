import Image from 'next/image'
import { cn } from '@/lib/utils'

const POSITION_COLORS: Record<string, string> = {
  Portera: 'bg-amber-500', Portero: 'bg-amber-500',
  Defensa: 'bg-blue-500',
  Centrocampista: 'bg-green-500',
  Delantera: 'bg-red-500', Delantero: 'bg-red-500',
}

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
  const bgColor = position ? (POSITION_COLORS[position] ?? 'bg-slate-600') : 'bg-slate-600'

  return (
    <div className={cn('relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl', dims[size], !photoUrl && bgColor, className)}>
      {photoUrl ? (
        <Image src={photoUrl} alt={name} fill className="object-cover" unoptimized />
      ) : (
        <span className="font-[family-name:var(--font-heading)] font-black text-white">{initials}</span>
      )}
    </div>
  )
}
