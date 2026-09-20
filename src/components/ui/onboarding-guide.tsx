'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

type Step = {
  num: number
  label: string
  description: string
  done: boolean
  href: string
  icon: string
}

type Props = {
  hasTeam: boolean
  hasPlayers: boolean
  hasSeason: boolean
  hasMatches: boolean
  teamId?: string
  seasonId?: string
}

export function OnboardingGuide({ hasTeam, hasPlayers, hasSeason, hasMatches, teamId, seasonId }: Props) {
  const [dismissed, setDismissed] = useState(true) // empieza oculto hasta que leemos localStorage

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem('onboarding-dismissed') === '1')
    } catch { setDismissed(false) }
  }, [])

  const allDone = hasTeam && hasPlayers && hasSeason && hasMatches
  if (allDone || dismissed) return null

  function dismiss() {
    try { localStorage.setItem('onboarding-dismissed', '1') } catch { /* noop */ }
    setDismissed(true)
  }

  const steps: Step[] = [
    {
      num: 1,
      label: 'Crea tu equipo',
      description: 'Dale nombre, categoría y sube el escudo.',
      done: hasTeam,
      href: '/dashboard/team/new',
      icon: 'shield',
    },
    {
      num: 2,
      label: 'Añade las jugadoras',
      description: 'Nombre, dorsal y posición de cada una.',
      done: hasPlayers,
      href: teamId ? `/dashboard/team/${teamId}/players` : '/dashboard',
      icon: 'group',
    },
    {
      num: 3,
      label: 'Crea una temporada',
      description: 'Por ejemplo "Temporada 2025-2026".',
      done: hasSeason,
      href: teamId ? `/dashboard/team/${teamId}/seasons` : '/dashboard',
      icon: 'calendar_month',
    },
    {
      num: 4,
      label: 'Registra tu primer partido',
      description: 'Rival, resultado y estadísticas de cada jugadora.',
      done: hasMatches,
      href: seasonId ? `/dashboard/season/${seasonId}` : '/dashboard',
      icon: 'sports_soccer',
    },
  ]

  const doneCount = steps.filter(s => s.done).length
  const nextStep  = steps.find(s => !s.done)

  return (
    <section className="mb-8 rounded-2xl border p-6 relative overflow-hidden"
      style={{ backgroundColor: '#111713', borderColor: 'rgba(34,197,94,0.2)' }}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />

      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
            Guía de inicio
          </p>
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
            {doneCount === 0 ? '¡Bienvenido a Coachly!' : `${doneCount} de 4 pasos completados`}
          </h3>
          <p className="text-sm mt-0.5" style={{ color: '#89968e' }}>
            Sigue estos pasos para empezar a registrar estadísticas
          </p>
        </div>
        <div className="flex items-start gap-3 flex-shrink-0">
          {/* Barra de progreso */}
          <div className="flex flex-col items-end gap-1.5 mt-0.5">
            <span className="text-[10px] font-bold" style={{ color: 'var(--accent)' }}>{doneCount}/4</span>
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#253028' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(doneCount / 4) * 100}%`, backgroundColor: 'var(--accent)' }} />
            </div>
          </div>
          {/* Botón cerrar */}
          <button
            onClick={dismiss}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-white/10 cursor-pointer"
            style={{ color: '#637168' }}
            title="Ocultar guía"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map(step => {
          const isNext = step === nextStep
          return (
            <Link
              key={step.num}
              href={step.done ? '#' : step.href}
              onClick={step.done ? (e) => e.preventDefault() : undefined}
              className={`flex flex-col gap-2 p-4 rounded-xl border transition-all ${step.done ? 'opacity-50' : isNext ? 'hover:-translate-y-0.5' : 'opacity-70 hover:opacity-90'}`}
              style={{
                backgroundColor: step.done ? 'rgba(34,197,94,0.05)' : isNext ? '#1e2740' : '#111713',
                borderColor: step.done ? 'rgba(34,197,94,0.2)' : isNext ? 'rgba(34,197,94,0.4)' : '#253028',
                cursor: step.done ? 'default' : 'pointer',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg"
                  style={{ backgroundColor: step.done ? 'rgba(34,197,94,0.15)' : 'rgba(46,52,71,0.5)' }}>
                  <span className="material-symbols-outlined"
                    style={{ fontSize: 18, color: step.done ? 'var(--accent)' : isNext ? '#edf2ee' : '#637168',
                      fontVariationSettings: step.done ? "'FILL' 1" : "'FILL' 0" }}>
                    {step.done ? 'check_circle' : step.icon}
                  </span>
                </div>
                <span className="text-[10px] font-black" style={{ color: step.done ? 'var(--accent)' : '#637168' }}>
                  {step.done ? '✓' : `Paso ${step.num}`}
                </span>
              </div>
              <p className="text-sm font-bold" style={{ color: step.done ? 'var(--accent)' : isNext ? '#edf2ee' : '#637168' }}>
                {step.label}
              </p>
              <p className="text-[11px] leading-snug" style={{ color: '#637168' }}>
                {step.description}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
