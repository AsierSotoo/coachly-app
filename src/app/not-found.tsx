import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{ backgroundColor: '#020617' }}>
      <div className="text-center max-w-sm">
        <p className="text-[96px] font-extrabold leading-none tabular-nums" style={{ color: '#253028', fontFamily: 'Sora, sans-serif' }}>
          404
        </p>
        <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto -mt-4 mb-6 shadow-lg shadow-green-500/20">
          <img src="/logo.png" alt="Coachly" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
          Página no encontrada
        </h1>
        <p className="text-sm mt-2 mb-8" style={{ color: '#89968e' }}>
          Esta página no existe o fue movida a otra dirección.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
          style={{ backgroundColor: '#72e697', color: '#07140c' }}
        >
          <span className="material-symbols-outlined">home</span>
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
