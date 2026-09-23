'use client'

import { useState, useEffect, useId } from 'react'

interface Props {
  storageKey: string
  title: string
  icon?: string
  badge?: string | number
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

export function CollapsibleSection({
  storageKey,
  title,
  icon,
  badge,
  defaultOpen = true,
  children,
  className = '',
}: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [hydrated, setHydrated] = useState(false)
  const id = useId()

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`collapse:${storageKey}`)
      if (saved !== null) setOpen(saved === '1')
    } catch {}
    setHydrated(true)
  }, [storageKey])

  function toggle() {
    const next = !open
    setOpen(next)
    try { localStorage.setItem(`collapse:${storageKey}`, next ? '1' : '0') } catch {}
  }

  return (
    <div className={`mb-6 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={id}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl active:scale-[0.99]"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--bdr-strong)',
          borderLeftWidth: 3,
          borderLeftColor: open ? 'var(--accent)' : 'var(--bdr-strong)',
          transition: 'border-left-color 0.2s ease',
          color: 'var(--tx)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <span
              className="material-symbols-outlined flex-shrink-0"
              style={{
                fontSize: 15,
                color: open ? 'var(--accent)' : 'var(--tx-3)',
                transition: 'color 0.2s ease',
              }}
            >
              {icon}
            </span>
          )}
          <span className="text-[11px] font-black uppercase tracking-widest truncate" style={{ color: 'var(--tx-2)' }}>
            {title}
          </span>
          {badge !== undefined && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'var(--bg-card)', color: 'var(--tx-3)', border: '1px solid var(--bdr)' }}>
              {badge}
            </span>
          )}
        </div>
        <span
          className="material-symbols-outlined flex-shrink-0 transition-transform duration-200"
          style={{ fontSize: 18, color: 'var(--tx-3)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          expand_more
        </span>
      </button>

      <div
        id={id}
        style={{
          display: hydrated ? (open ? 'block' : 'none') : (defaultOpen ? 'block' : 'none'),
          marginTop: 8,
        }}
      >
        {children}
      </div>
    </div>
  )
}
