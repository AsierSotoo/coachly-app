'use client'

import { useState, useEffect } from 'react'

export function ThemeToggle({ className, compact }: { className?: string; compact?: boolean }) {
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    // Sync with whatever the flash-prevention script already set
    const current = document.documentElement.getAttribute('data-theme')
    setIsLight(current === 'light')
  }, [])

  function handleToggle() {
    const next = isLight ? 'dark' : 'light'
    setIsLight(!isLight)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('coachly-theme', next)
  }

  const w = compact ? 48 : 64
  const h = compact ? 26 : 32
  const knob = compact ? 18 : 24

  // Dark mode → knob blanco con luna oscura
  // Light mode → knob amarillo con sol oscuro
  const trackBg    = isLight ? '#fde68a' : '#1e2a22'
  const trackBdr   = isLight ? '#f59e0b' : '#2d3d32'
  const knobBg     = isLight ? '#f59e0b' : '#e2e8f0'
  const iconColor  = isLight ? '#78350f' : '#1e293b'

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      className={`relative cursor-pointer outline-none ${className ?? ''}`}
      style={{
        width: w,
        height: h,
        borderRadius: 100,
        backgroundColor: trackBg,
        border: `1.5px solid ${trackBdr}`,
        flexShrink: 0,
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      {/* Knob */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: (h - knob) / 2,
          left: (h - knob) / 2,
          width: knob,
          height: knob,
          borderRadius: '50%',
          backgroundColor: knobBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isLight ? `translateX(${w - knob - (h - knob)}px)` : 'translateX(0)',
          transition: 'transform 0.26s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.25s ease',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          pointerEvents: 'none',
        }}
      >
        {/* Luna */}
        <span className="material-symbols-outlined"
          style={{
            position: 'absolute',
            fontSize: compact ? 12 : 14,
            color: iconColor,
            opacity: isLight ? 0 : 1,
            transform: isLight ? 'rotate(20deg) scale(0.5)' : 'rotate(0) scale(1)',
            transition: 'opacity 0.18s ease, transform 0.2s ease',
            lineHeight: 1,
            userSelect: 'none',
          }}>dark_mode</span>
        {/* Sol */}
        <span className="material-symbols-outlined"
          style={{
            position: 'absolute',
            fontSize: compact ? 12 : 14,
            color: iconColor,
            opacity: isLight ? 1 : 0,
            transform: isLight ? 'rotate(0) scale(1)' : 'rotate(-20deg) scale(0.5)',
            transition: 'opacity 0.18s ease, transform 0.2s ease',
            lineHeight: 1,
            userSelect: 'none',
          }}>light_mode</span>
      </span>
    </button>
  )
}
