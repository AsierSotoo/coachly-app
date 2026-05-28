import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { error } = await supabase.from('teams').select('count').limit(1)
  const connected = !error

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-white px-4">
      <main className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Coachly
        </h1>
        <p className="max-w-sm text-base text-gray-500">
          Las estadísticas de tu equipo, en un sitio.
        </p>
        <div className="flex items-center gap-2 text-sm">
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-500">
            {connected ? 'Supabase conectado' : `Error: ${error?.message}`}
          </span>
        </div>
      </main>
    </div>
  )
}
