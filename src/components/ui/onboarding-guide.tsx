'use client'

import Link from 'next/link'

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
  const allDone = hasTeam && hasPlayers && hasSeason && hasMatches
  if (allDone) return null

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
      style={{ backgroundColor: '#0f172a', borderColor: 'rgba(34,197,94,0.2)' }}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none select-none">
        <span className="material-symbols-outlined" style={{ fontSize: 120 }}>rocket_launch</span>
      </div>

      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#4be277' }}>
            Guía de inicio
          </p>
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
            {doneCount === 0
              ? '¡Bienvenido a Coachly!'
              : `${doneCount} de 4 pasos completados`}
          </h3>
          <p className="text-sm mt-0.5" style={{ color: '#adb4ce' }}>
            Sigue estos pasos para empezar a registrar estadísticas
          </p>
        </div>
        {/* Barra de progreso */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <span className="text-[10px] font-bold" style={{ color: '#4be277' }}>{doneCount}/4</span>
          <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(doneCount / 4) * 100}%`, backgroundColor: '#22c55e' }} />
          </div>
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
                backgroundColor: step.done ? 'rgba(34,197,94,0.05)' : isNext ? '#1e2740' : '#151b2d',
                borderColor: step.done ? 'rgba(34,197,94,0.2)' : isNext ? 'rgba(34,197,94,0.4)' : '#1e293b',
                cursor: step.done ? 'default' : 'pointer',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg"
                  style={{ backgroundColor: step.done ? 'rgba(34,197,94,0.15)' : 'rgba(46,52,71,0.5)' }}>
                  <span className="material-symbols-outlined"
                    style={{ fontSize: 18, color: step.done ? '#4be277' : isNext ? '#dce1fb' : '#64748b',
                      fontVariationSettings: step.done ? "'FILL' 1" : "'FILL' 0" }}>
                    {step.done ? 'check_circle' : step.icon}
                  </span>
                </div>
                <span className="text-[10px] font-black"
                  style={{ color: step.done ? '#4be277' : '#475569' }}>
                  {step.done ? '✓' : `Paso ${step.num}`}
                </span>
              </div>
              <p className="text-sm font-bold" style={{ color: step.done ? '#4be277' : isNext ? '#dce1fb' : '#64748b' }}>
                {step.label}
              </p>
              <p className="text-[11px] leading-snug" style={{ color: '#475569' }}>
                {step.description}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
