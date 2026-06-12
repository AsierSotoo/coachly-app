'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { BarChart3, Users, Shield } from 'lucide-react'

const features = [
  { icon: BarChart3, label: 'Estadísticas en tiempo real', desc: 'Goleadoras, minutos, tarjetas y más.' },
  { icon: Users, label: 'Gestión de plantilla', desc: 'Dorsal, posición, altas y bajas.' },
  { icon: Shield, label: 'Multi-temporada', desc: 'Compara rendimiento año a año.' },
]

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 overflow-hidden" style={{ backgroundColor: '#020617' }}>

      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-green-500/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-green-500/3 blur-[80px]" />
      </div>

      <div className="relative w-full max-w-sm text-center">

        {/* Logo animado */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-green-500 shadow-2xl shadow-green-500/30"
        >
          <span className="font-[family-name:var(--font-heading)] text-3xl font-bold text-white">C</span>
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

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 flex flex-col gap-2 text-left"
        >
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 backdrop-blur">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                <Icon className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="mt-8 flex flex-col gap-3"
        >
          <Link
            href="/register"
            className="flex h-13 items-center justify-center rounded-2xl bg-green-500 text-sm font-bold text-white shadow-xl shadow-green-500/25 transition-all hover:bg-green-400 hover:shadow-green-500/40 active:scale-[0.98] cursor-pointer py-3.5"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/login"
            className="flex h-13 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/60 text-sm font-medium text-slate-300 backdrop-blur transition-all hover:bg-slate-800 hover:border-slate-600 active:scale-[0.98] cursor-pointer py-3.5"
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
