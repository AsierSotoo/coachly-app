import { createClient } from '@/lib/supabase-server'
import { logout } from '@/app/auth/actions'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/dashboard" className="text-base font-bold text-gray-900">
          Coachly
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-gray-400 sm:block">{user?.email}</span>
          <form action={logout}>
            <button type="submit" className="text-xs text-gray-400 hover:text-gray-900">
              Salir
            </button>
          </form>
        </div>
      </header>

      {/* Contenido */}
      <div className="flex-1 pb-16">
        {children}
      </div>

      {/* Barra inferior móvil */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-gray-200 bg-white">
        <Link href="/dashboard" className="flex flex-1 flex-col items-center gap-0.5 py-2 text-gray-500 hover:text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span className="text-xs">Inicio</span>
        </Link>
        <Link href="/dashboard/team/new" className="flex flex-1 flex-col items-center gap-0.5 py-2 text-gray-500 hover:text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
          <span className="text-xs">Equipo</span>
        </Link>
      </nav>
    </div>
  )
}
