'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

const steps = [
  {
    day: 'Lunes',
    icon: 'event_available',
    action: 'Disponibilidad abierta',
    detail: '16 / 18 confirmadas en 2 horas',
    color: 'var(--accent)',
  },
  {
    day: 'Jueves',
    icon: 'groups',
    action: 'Convocatoria lista',
    detail: 'Once elegido, PDF listo para compartir',
    color: 'var(--accent)',
  },
  {
    day: 'Sábado',
    icon: 'sports_soccer',
    action: 'Partido registrado',
    detail: 'Goles, minutos y tarjetas en 4 minutos',
    color: 'var(--accent)',
  },
  {
    day: 'Domingo',
    icon: 'query_stats',
    action: 'Rankings actualizados',
    detail: 'Goleadoras, carga y sanciones solos',
    color: 'var(--accent)',
  },
]

const form = ['V', 'V', 'E', 'V', 'D']

export default function LandingPage() {
  return (
    <main className="landing-shell min-h-screen overflow-hidden">
      <nav className="landing-nav mx-auto flex w-full max-w-[1180px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="Coachly, inicio">
          <Image src="/logo.png" alt="" width={38} height={38} className="h-9 w-9 rounded-[10px] object-cover" priority />
          <span className="font-[family-name:var(--font-heading)] text-[17px] font-extrabold tracking-[-0.03em] text-white">
            Coach<span className="text-[var(--accent)]">ly</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="px-3 py-2 text-sm font-semibold text-[#bdc7c1] transition-colors hover:text-white sm:px-4">Entrar</Link>
          <Link href="/register" className="landing-primary rounded-[10px] px-4 py-2.5 text-sm font-bold text-[var(--accent-fg)] transition-transform active:scale-[.98] sm:px-5">Probar Coachly</Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="mx-auto grid w-full max-w-[1180px] gap-12 px-5 pb-16 pt-12 sm:px-8 sm:pt-18 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-16 lg:px-10 lg:pb-24 lg:pt-20">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/8 px-3 py-1 text-[11px] font-semibold text-[var(--accent)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            Para entrenadores de fútbol
          </span>
          <h1 className="mt-4 max-w-[620px] font-[family-name:var(--font-heading)] text-[42px] font-extrabold leading-[1.02] tracking-[-0.055em] text-[#f4f7f5] sm:text-[58px] lg:text-[68px]">Menos hojas.<br />Más fútbol.</h1>
          <p className="mt-6 max-w-[500px] text-[16px] leading-7 text-[#9aa7a0] sm:text-[17px]">Planifica partidos, prepara convocatorias y entiende la evolución de tu equipo sin perder tiempo entre archivos y grupos de WhatsApp.</p>
          <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
            <Link href="/register" className="landing-primary flex min-h-[48px] items-center justify-center rounded-[10px] px-6 text-sm font-bold text-[var(--accent-fg)] transition-transform active:scale-[.98]">
              Crear mi primer equipo
              <span className="material-symbols-outlined ml-2" style={{ fontSize: 17 }}>arrow_forward</span>
            </Link>
            <a href="#semana" className="flex min-h-[48px] items-center justify-center rounded-[10px] border border-white/10 px-6 text-sm font-semibold text-[#cbd3ce] transition-colors hover:border-white/20 hover:text-white">
              Ver cómo funciona
            </a>
          </div>
          <p className="mt-5 text-xs text-[#637168]">Gratis · Sin tarjeta · Funciona en el móvil</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .1, duration: .6 }} className="relative lg:pl-6">
          <div className="match-board relative overflow-hidden rounded-[18px] border border-white/[.09] p-4 shadow-2xl sm:p-6">
            <div className="mb-6 flex items-center justify-between border-b border-white/[.07] pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#728078]">Sábado · 16:15</p>
                <p className="mt-1 font-[family-name:var(--font-heading)] text-lg font-bold text-white">Próximo partido</p>
              </div>
              <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">Liga</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-3 sm:gap-6">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-[#151c18] text-xl font-black text-[var(--accent)] sm:h-20 sm:w-20">CDI</div>
                <p className="mt-3 text-sm font-bold text-white">CD Ilumberri</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#637168]">Jornada 18</p>
                <p className="my-2 font-[family-name:var(--font-heading)] text-2xl font-extrabold text-white">VS</p>
                <p className="text-[11px] text-[#818e86]">Aoiz · Campo 1</p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-[#151c18] text-xl font-black text-[#d8ddd9] sm:h-20 sm:w-20">B</div>
                <p className="mt-3 text-sm font-bold text-white">Bidezarra</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 divide-x divide-white/[.07] rounded-[12px] border border-white/[.07] bg-black/20 py-4">
              <div className="text-center">
                <strong className="block text-xl text-white">34</strong>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#637168]">Puntos</span>
              </div>
              <div className="text-center">
                <strong className="block text-xl text-white">+15</strong>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#637168]">Diferencia</span>
              </div>
              <div className="text-center">
                <div className="flex h-7 items-center justify-center gap-1">
                  {form.map((item, index) => (
                    <span key={index} className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black ${item === 'V' ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : item === 'E' ? 'bg-[#6d756f] text-white' : 'bg-[#d76b6b] text-white'}`}>{item}</span>
                  ))}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#637168]">Últimos 5</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-[12px] bg-[var(--accent)] px-4 py-3 text-[var(--accent-fg)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: 19 }}>group</span>
                <span className="text-xs font-extrabold">14 de 18 disponibles</span>
              </div>
              <span className="text-xs font-bold">Preparar convocatoria →</span>
            </div>
          </div>
          <div className="mt-3 hidden items-center gap-3 sm:flex">
            <div className="rounded-[10px] border border-white/10 bg-[#121915] px-4 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-[#637168]">Último partido</p>
              <p className="mt-0.5 text-sm font-bold text-white"><span className="mr-2 text-[var(--accent)]">Victoria</span> 3–1</p>
            </div>
            <p className="text-xs text-[#3e4942]">vs Mutilva CF · Liga</p>
          </div>
        </motion.div>
      </section>

      {/* ── Semana tipo ───────────────────────────────────────── */}
      <section id="semana" className="border-t border-white/[.06] bg-[#0b100d]">
        <div className="mx-auto w-full max-w-[1180px] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <p className="mb-10 text-[13px] font-semibold text-[#637168]">Una semana normal con Coachly</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.day}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="relative rounded-[14px] border border-white/[.07] bg-[#0f1511] p-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#3e4942]">{step.day}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: step.color }}>{step.icon}</span>
                </div>
                <p className="text-[15px] font-bold leading-snug text-[#edf2ee]">{step.action}</p>
                <p className="mt-1.5 text-[13px] leading-5 text-[#637168]">{step.detail}</p>
                {i < steps.length - 1 && (
                  <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-[#2a342d] lg:block" style={{ fontSize: 20 }}>›</span>
                )}
              </motion.div>
            ))}
          </div>
          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-[#637168]">Sin Excel. Sin grupos de WhatsApp para convocar. Sin olvidos.</p>
            <Link href="/register" className="landing-primary rounded-[10px] px-5 py-2.5 text-sm font-bold text-[var(--accent-fg)] transition-transform active:scale-[.98] whitespace-nowrap">
              Empezar ahora
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
