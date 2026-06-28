'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

const features = [
  { icon: 'bar_chart', label: 'Estadísticas en tiempo real', desc: 'Goleadoras, minutos, tarjetas y más.' },
  { icon: 'group',     label: 'Gestión de plantilla',        desc: 'Dorsal, posición, altas y bajas.' },
  { icon: 'shield',    label: 'Multi-temporada',             desc: 'Compara rendimiento año a año.' },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 overflow-hidden" style={{ backgroundColor: '#020617' }}>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-green-500/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-green-500/3 blur-[80px]" />
      </div>

      <div className="relative w-full max-w-sm text-center">

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="mb-6 inline-block rounded-3xl overflow-hidden shadow-2xl shadow-green-500/30"
        >
          <Image src="/logo.png" alt="Coachly" width={80} height={80} className="h-20 w-20 object-cover" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="font-[family-name:var(--font-heading)] text-4xl font-bold tracking-tight text-white"
        >
          Coachly
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-3 text-sm text-slate-400 leading-relaxed"
        >
          Las estadísticas de tu equipo,<br />en un sitio. Para entrenadores.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 flex flex-col gap-2 text-left"
        >
          {features.map(({ icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 backdrop-blur">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#4be277' }}>{icon}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="mt-8 flex flex-col gap-3"
        >
          <Link
            href="/register"
            className="flex items-center justify-center rounded-2xl bg-green-500 text-sm font-bold text-white shadow-xl shadow-green-500/25 transition-all hover:bg-green-400 active:scale-[0.98] cursor-pointer py-3.5"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/60 text-sm font-medium text-slate-300 backdrop-blur transition-all hover:bg-slate-800 hover:border-slate-600 active:scale-[0.98] cursor-pointer py-3.5"
          >
            Iniciar sesión
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-xs text-slate-600"
        >
          Gratis para empezar · Sin tarjeta de crédito
        </motion.p>
      </div>
    </div>
  )
}
