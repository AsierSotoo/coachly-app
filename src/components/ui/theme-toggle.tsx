'use client'

import { useState, useEffect } from 'react'

export function ThemeToggle({ className }: { className?: string }) {
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

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      className={`relative cursor-pointer outline-none ${className ?? ''}`}
      style={{
        width: 64,
        height: 32,
        borderRadius: 100,
        backgroundColor: isLight ? '#d4e9d8' : '#1e3028',
        border: `1.5px solid ${isLight ? '#b8d4bc' : '#2d4535'}`,
        flexShrink: 0,
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      {/* Knob */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 3,
          left: 3,
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isLight ? 'translateX(32px)' : 'translateX(0)',
          transition: 'transform 0.26s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.22)',
          pointerEvents: 'none',
        }}
      >
        <svg width={11} height={11} viewBox="0 0 24 24" fill="var(--accent-fg)"
          style={{
            position: 'absolute',
            opacity: isLight ? 0 : 1,
            transform: isLight ? 'rotate(20deg) scale(0.6)' : 'rotate(0) scale(1)',
            transition: 'opacity 0.18s ease, transform 0.2s ease',
          }}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
        </svg>
        <svg width={11} height={11} viewBox="0 0 24 24" fill="var(--accent-fg)"
          style={{
            position: 'absolute',
            opacity: isLight ? 1 : 0,
            transform: isLight ? 'rotate(0) scale(1)' : 'rotate(-20deg) scale(0.6)',
            transition: 'opacity 0.18s ease, transform 0.2s ease',
          }}>
          <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-14a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0V4a1 1 0 0 1 1-1zm0 16a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1zm9-9h1a1 1 0 0 1 0 2h-1a1 1 0 0 1 0-2zM3 11H2a1 1 0 0 0 0 2h1a1 1 0 0 0 0-2zm15.66-6.07.7-.7a1 1 0 1 1 1.42 1.41l-.7.7a1 1 0 0 1-1.42-1.41zM4.64 19.07l-.7.7a1 1 0 1 1-1.42-1.41l.7-.7a1 1 0 0 1 1.42 1.41zm14.14 1.42-.7-.7a1 1 0 0 1 1.42-1.41l.7.7a1 1 0 0 1-1.42 1.41zM4.64 4.93l-.7-.7A1 1 0 0 0 2.53 5.64l.7.7a1 1 0 0 0 1.41-1.41z"/>
        </svg>
      </span>
    </button>
  )
}
