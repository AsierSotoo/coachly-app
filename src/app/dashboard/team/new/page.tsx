import { createTeam } from '../actions'
import Link from 'next/link'

export default function NewTeamPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <main className="mx-auto max-w-sm px-4 py-8">
      <div className="mb-8">
        <Link href="/dashboard" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← Volver</Link>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-bold text-white">Nuevo equipo</h1>
        <p className="mt-1 text-sm text-slate-400">Configura los datos básicos de tu equipo.</p>
      </div>

      <form action={createTeam} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-slate-400">Nombre del equipo</label>
          <input id="name" name="name" type="text" required placeholder="ej. CD Ilumberri" className="h-12 px-4 text-sm" />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="gender" className="text-xs font-medium uppercase tracking-wider text-slate-400">Género</label>
          <select id="gender" name="gender" required className="h-12 px-4 text-sm">
            <option value="">Selecciona...</option>
            <option value="Femenino">Femenino</option>
            <option value="Masculino">Masculino</option>
            <option value="Mixto">Mixto</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Categoría <span className="normal-case text-slate-600">(opcional)</span>
          </label>
          <input id="category" name="category" type="text" placeholder="ej. Primera Autonómica" className="h-12 px-4 text-sm" />
        </div>

        <ErrorMessage searchParams={searchParams} />

        <button type="submit" className="mt-2 flex h-12 items-center justify-center rounded-xl bg-green-500 text-sm font-semibold text-white transition-colors hover:bg-green-400 cursor-pointer">
          Crear equipo
        </button>
      </form>
    </main>
  )
}

async function ErrorMessage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  if (!error) return null
  return <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</p>
}
