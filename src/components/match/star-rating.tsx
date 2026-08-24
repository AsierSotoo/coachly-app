'use client'

import { useState } from 'react'

interface Props {
  name: string
  defaultValue?: number | null
  disabled?: boolean
}

export function StarRating({ name, defaultValue, disabled }: Props) {
  const [rating, setRating] = useState(defaultValue ?? 0)
  const [hover, setHover] = useState(0)

  const active = hover || rating

  return (
    <div className="flex items-center gap-0.5">
      <input type="hidden" name={name} value={rating > 0 ? rating : ''} />
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => setRating(r => r === n ? 0 : n)}
          onMouseEnter={() => !disabled && setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="cursor-pointer transition-transform hover:scale-125 disabled:cursor-default disabled:opacity-30"
          title={`${n} estrella${n > 1 ? 's' : ''}`}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 15,
              color: n <= active ? '#fbbf24' : '#334155',
              fontVariationSettings: n <= active ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 300",
              transition: 'color .1s, font-variation-settings .1s',
            }}
          >star</span>
        </button>
      ))}
    </div>
  )
}
