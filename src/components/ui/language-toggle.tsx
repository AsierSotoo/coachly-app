'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function LanguageToggle({ current }: { current: 'es' | 'en' }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function switchTo(lang: 'es' | 'en') {
    if (lang === current) return
    document.cookie = `locale=${lang};path=/;max-age=31536000;samesite=lax`
    startTransition(() => router.refresh())
  }

  return (
    <div
      role="group"
      aria-label="Idioma"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: 3,
        borderRadius: 10,
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--bdr)',
        opacity: pending ? 0.6 : 1,
        transition: 'opacity 0.2s ease',
        flexShrink: 0,
      }}
    >
      {(['es', 'en'] as const).map(lang => {
        const active = lang === current
        return (
          <button
            key={lang}
            onClick={() => switchTo(lang)}
            disabled={pending}
            aria-pressed={active}
            aria-label={lang === 'es' ? 'Español' : 'English'}
            style={{
              padding: '4px 9px',
              borderRadius: 7,
              border: 'none',
              background: active ? 'var(--bg-card)' : 'transparent',
              color: active ? 'var(--tx)' : 'var(--tx-3)',
              fontFamily: 'Sora, sans-serif',
              fontSize: 11,
              fontWeight: active ? 700 : 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: active ? 'default' : 'pointer',
              transition: 'background 0.15s ease, color 0.15s ease',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              lineHeight: 1,
            }}
          >
            {lang}
          </button>
        )
      })}
    </div>
  )
}
