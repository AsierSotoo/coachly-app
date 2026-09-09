import { PlayerAvatar } from '@/components/team/player-avatar'

type Status = 'available' | 'unavailable' | 'doubt'

interface Player {
  id: string
  name: string
  number: number | null
  position: string | null
  photo_url?: string | null
}

interface Props {
  players: Player[]
  responses: { player_id: string; status: Status }[]
}

const CHIP = {
  available:   { label: 'Voy',      color: '#4be277', bg: 'rgba(75,226,119,0.12)',  icon: 'check_circle' },
  doubt:       { label: 'Duda',     color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  icon: 'help' },
  unavailable: { label: 'No puedo', color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: 'cancel' },
} as const

export function AvailabilityCoachCard({ players, responses }: Props) {
  const map = new Map(responses.map(r => [r.player_id, r.status]))

  const yes  = players.filter(p => map.get(p.id) === 'available')
  const doubt = players.filter(p => map.get(p.id) === 'doubt')
  const no   = players.filter(p => map.get(p.id) === 'unavailable')
  const none = players.filter(p => !map.has(p.id))

  const total = responses.length

  return (
    <section className="rounded-2xl border overflow-hidden" style={{ borderColor: '#2e3447', backgroundColor: '#151b2d' }}>
      {/* Cabecera */}
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: '#2e3447' }}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#adb4ce' }}>how_to_reg</span>
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>Disponibilidad</h2>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold">
          {yes.length > 0 && (
            <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(75,226,119,0.1)', color: '#4be277' }}>✓ {yes.length}</span>
          )}
          {doubt.length > 0 && (
            <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>? {doubt.length}</span>
          )}
          {no.length > 0 && (
            <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#f87171' }}>✗ {no.length}</span>
          )}
          {none.length > 0 && total > 0 && (
            <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(173,180,206,0.08)', color: '#475569' }}>{none.length} sin responder</span>
          )}
          {total === 0 && (
            <span className="text-[11px]" style={{ color: '#475569' }}>Sin respuestas aún</span>
          )}
        </div>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-1.5 py-7 px-4 text-center">
          <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#334155' }}>schedule_send</span>
          <p className="text-xs" style={{ color: '#475569' }}>Nadie ha respondido todavía al enlace</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'rgba(46,52,71,0.6)' }}>
          {players.map(p => {
            const status = map.get(p.id)
            const cfg = status ? CHIP[status] : null
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <PlayerAvatar name={p.name} photoUrl={p.photo_url ?? null} position={p.position} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                  {p.position && <p className="text-[10px]" style={{ color: '#475569' }}>{p.position}</p>}
                </div>
                {cfg ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                    {cfg.label}
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ color: '#334155', backgroundColor: 'rgba(51,65,85,0.2)' }}>
                    Sin respuesta
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
