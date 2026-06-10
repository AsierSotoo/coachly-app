import { createTeam } from '../actions'

export default function NewTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Crear equipo</h1>
        <p className="mb-8 text-sm text-gray-500">Ponle nombre a tu equipo para empezar.</p>

        <form action={createTeam} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nombre del equipo
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="ej. CD Sarriguren Femenino"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="category" className="text-sm font-medium text-gray-700">
              Categoría <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              id="category"
              name="category"
              type="text"
              placeholder="ej. Autonómica femenina"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <ErrorMessage searchParams={searchParams} />

          <button
            type="submit"
            className="mt-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
          >
            Crear equipo
          </button>
        </form>
      </div>
    </div>
  )
}

async function ErrorMessage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  if (!params.error) return null
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{params.error}</p>
  )
}
