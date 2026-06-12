import Image from 'next/image'
import { cn } from '@/lib/utils'

interface TeamLogoProps {
  name: string
  logoUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: { wrapper: 'h-8 w-8 rounded-xl text-sm', font: 'text-xs' },
  md: { wrapper: 'h-11 w-11 rounded-2xl', font: 'text-base' },
  lg: { wrapper: 'h-14 w-14 rounded-2xl', font: 'text-xl' },
  xl: { wrapper: 'h-20 w-20 rounded-3xl', font: 'text-2xl' },
}

export function TeamLogo({ name, logoUrl, size = 'md', className }: TeamLogoProps) {
  const s = sizes[size]

  return (
    <div className={cn(
      'relative flex shrink-0 items-center justify-center overflow-hidden',
      s.wrapper,
      logoUrl ? 'bg-white p-1' : 'bg-gradient-to-br from-green-500 to-green-700 shadow-lg shadow-green-500/20',
      className
    )}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`Escudo ${name}`}
          fill
          className="object-contain p-1.5"
          unoptimized
        />
      ) : (
        <span className={cn('font-[family-name:var(--font-heading)] font-black text-white', s.font)}>
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}
