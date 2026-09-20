'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { setPublicAvailabilityForm } from '@/lib/public-availability-actions'

type Player = { id: string; name: string; number: number | null; position: string | null }
type StatusKey = 'available' | 'unavailable' | 'doubt'
type AvailRow = { playerId: string; status: StatusKey }

const STATUS_CONFIG = {
  available:   { label: 'Voy',      icon: 'check_circle', color: 'var(--accent)', bg: 'rgba(75,226,119,0.15)',  border: 'rgba(75,226,119,0.4)' },
  doubt:       { label: 'Duda',     icon: 'help',         color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.4)' },
  unavailable: { label: 'No puedo', icon: 'cancel',       color: '#f87171', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.4)' },
} as const

interface Props {
  token: string
  eventType: 'match' | 'training'
  eventId: string
  teamId: string
  teamName: string
  teamLogo: string | null
  eventTitle: string
  eventDate: string
  eventSubtitle: string
  rivalLogo: string | null
  players: Player[]
  initialAvail: AvailRow[]
}

export function AvailabilityClient({
  token, eventType, eventId, teamId, teamName, teamLogo,
  eventTitle, eventDate, eventSubtitle, rivalLogo,
  players, initialAvail,
}: Props) {
  const storageKey = `coachly_player_${teamId}`

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [avail, setAvail] = useState<Map<string, StatusKey>>(
    new Map(initialAvail.map(r => [r.playerId, r.status]))
  )
  const [pending, setPending] = useState<string | null>(null) // playerId being submitted
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(storageKey)
    // Verify the saved player is still in this team
    if (saved && players.some(p => p.id === saved)) {
      setSelectedId(saved)
    }
  }, [storageKey, players])

  function selectPlayer(id: string) {
    localStorage.setItem(storageKey, id)
    setSelectedId(id)
  }

  const isMatch = eventType === 'match'
  const nAvail   = [...avail.values()].filter(s => s === 'available').length
  const nDoubt   = [...avail.values()].filter(s => s === 'doubt').length
  const nUnavail = [...avail.values()].filter(s => s === 'unavailable').length
  const selectedPlayer = players.find(p => p.id === selectedId)

  // Esperar hidratación para evitar flash (localStorage solo disponible en cliente)
  if (!mounted) {
    return <div className="min-h-screen" style={{ backgroundColor: '#080d1e' }} />
  }

  // ── Pantalla: ¿Quién eres? ───────────────────────────────────────────────
  if (!selectedId) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#080d1e', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {/* Header equipo */}
        <div className="px-4 py-4 border-b flex items-center gap-3"
          style={{ backgroundColor: '#090e0b', borderColor: '#253028' }}>
          {teamLogo
            ? <Image src={teamLogo} alt={teamName} width={32} height={32} className="rounded-lg object-contain" unoptimized />
            : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
                style={{ backgroundColor: '#253028', color: 'var(--accent)' }}>{teamName.charAt(0)}</div>
          }
          <div>
            <p className="text-xs font-semibold" style={{ color: '#89968e' }}>{teamName}</p>
            <p className="text-[10px]" style={{ color: '#637168' }}>{isMatch ? 'Partido' : 'Entrenamiento'} · {eventDate}</p>
          </div>
        </div>

        <div className="px-4 pt-8 pb-4 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#a78bfa' }}>person_search</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-1">¿Quién eres?</h1>
          <p className="text-sm" style={{ color: '#637168' }}>
            Selecciona tu nombre para confirmar tu asistencia
          </p>
        </div>

        <div className="px-3 pb-8 flex flex-col gap-2">
          {players.map(p => (
            <button key={p.id} onClick={() => selectPlayer(p.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all active:scale-[0.98]"
              style={{ backgroundColor: '#111713', borderColor: '#253028' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                style={{ backgroundColor: '#253028', color: '#89968e' }}>
                {p.number ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: '#edf2ee' }}>{p.name}</p>
                {p.position && <p className="text-[10px]" style={{ color: '#637168' }}>{p.position}</p>}
              </div>
              {avail.get(p.id) && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    color: STATUS_CONFIG[avail.get(p.id)!].color,
                    backgroundColor: STATUS_CONFIG[avail.get(p.id)!].bg,
                  }}>
                  {STATUS_CONFIG[avail.get(p.id)!].label}
                </span>
              )}
              <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18, color: '#2a342d' }}>
                chevron_right
              </span>
            </button>
          ))}
        </div>

        <div className="text-center pb-8">
          <p className="text-[10px]" style={{ color: '#334155' }}>Gestión de equipos con Coachly</p>
        </div>
      </div>
    )
  }

  // ── Pantalla: Confirmar asistencia ───────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080d1e', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header con resumen y jugador seleccionado */}
      <div className="sticky top-0 z-10 border-b" style={{ backgroundColor: '#090e0b', borderColor: '#253028' }}>
        <div className="flex items-center gap-3 px-4 py-3">
          {teamLogo
            ? <Image src={teamLogo} alt={teamName} width={28} height={28} className="rounded-md object-contain" unoptimized />
            : <div className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-black"
                style={{ backgroundColor: '#253028', color: 'var(--accent)' }}>{teamName.charAt(0)}</div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: '#89968e' }}>{teamName}</p>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <span style={{ color: 'var(--accent)' }}>{nAvail}✓</span>
            <span style={{ color: '#fbbf24' }}>{nDoubt}?</span>
            <span style={{ color: '#f87171' }}>{nUnavail}✗</span>
          </div>
        </div>
        {/* Jugador activo */}
        {selectedPlayer && (
          <div className="flex items-center gap-2 px-4 py-2 border-t" style={{ borderColor: '#253028', backgroundColor: 'rgba(167,139,250,0.05)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#a78bfa', fontVariationSettings: "'FILL' 1" }}>person</span>
            <span className="text-[11px] font-semibold" style={{ color: '#a78bfa' }}>
              Confirmando como: {selectedPlayer.name}
            </span>
          </div>
        )}
      </div>

      {/* Cabecera del evento */}
      <div className="px-4 pt-5 pb-3">
        {isMatch ? (
          <div className="flex items-center justify-center gap-5">
            <div className="flex flex-col items-center gap-1">
              {teamLogo
                ? <Image src={teamLogo} alt={teamName} width={48} height={48} className="rounded-xl object-contain" unoptimized />
                : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black"
                    style={{ backgroundColor: '#253028', color: 'var(--accent)' }}>{teamName.charAt(0)}</div>
              }
              <p className="text-[10px] font-semibold text-center max-w-[70px] leading-tight" style={{ color: '#89968e' }}>{teamName}</p>
            </div>
            <span className="text-xs font-black" style={{ color: '#637168' }}>VS</span>
            <div className="flex flex-col items-center gap-1">
              {rivalLogo
                ? <Image src={rivalLogo} alt={eventTitle} width={48} height={48} className="rounded-xl object-contain" unoptimized />
                : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black"
                    style={{ backgroundColor: '#253028', color: '#89968e' }}>
                    {eventTitle.replace('vs ', '').charAt(0)}
                  </div>
              }
              <p className="text-[10px] font-semibold text-center max-w-[70px] leading-tight" style={{ color: '#89968e' }}>
                {eventTitle.replace('vs ', '')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#fbbf24', fontVariationSettings: "'FILL' 1" }}>
                fitness_center
              </span>
            </div>
            <p className="text-base font-bold text-white">{eventTitle}</p>
          </div>
        )}
        <p className="text-center text-sm font-semibold capitalize mt-3" style={{ color: '#edf2ee' }}>{eventDate}</p>
        {eventSubtitle && (
          <p className="text-center text-xs mt-0.5" style={{ color: '#637168' }}>{eventSubtitle}</p>
        )}
      </div>

      {/* Tu confirmación */}
      {selectedId && (
        <div className="px-3 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: '#637168' }}>
            Tu confirmación
          </p>
          <div className="rounded-2xl border-2 overflow-hidden"
            style={{
              backgroundColor: '#111713',
              borderColor: avail.get(selectedId) ? STATUS_CONFIG[avail.get(selectedId)!].border : '#a78bfa',
            }}>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                style={{ backgroundColor: '#253028', color: '#89968e' }}>
                {selectedPlayer?.number ?? '?'}
              </div>
              <p className="text-sm font-bold flex-1" style={{ color: '#edf2ee' }}>{selectedPlayer?.name}</p>
              {avail.get(selectedId) && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: STATUS_CONFIG[avail.get(selectedId)!].color, backgroundColor: STATUS_CONFIG[avail.get(selectedId)!].bg }}>
                  {STATUS_CONFIG[avail.get(selectedId)!].label}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 border-t" style={{ borderColor: '#253028' }}>
              {(Object.entries(STATUS_CONFIG) as [StatusKey, typeof STATUS_CONFIG[StatusKey]][]).map(([key, s]) => {
                const active = avail.get(selectedId) === key
                const isSubmitting = pending === selectedId
                return (
                  <form key={key} action={async (fd: FormData) => {
                    setPending(selectedId)
                    await setPublicAvailabilityForm(fd)
                    setAvail(prev => new Map(prev).set(selectedId, key))
                    setPending(null)
                  }}>
                    <input type="hidden" name="event_type" value={eventType} />
                    <input type="hidden" name="event_id"   value={eventId} />
                    <input type="hidden" name="player_id"  value={selectedId} />
                    <input type="hidden" name="status"     value={key} />
                    <input type="hidden" name="token"      value={token} />
                    <button type="submit" disabled={isSubmitting}
                      className="w-full flex flex-col items-center gap-0.5 py-3.5 transition-all active:scale-95 disabled:opacity-50"
                      style={{ backgroundColor: active ? s.bg : 'transparent', color: active ? s.color : '#637168' }}>
                      <span className="material-symbols-outlined"
                        style={{ fontSize: 22, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                        {s.icon}
                      </span>
                      <span className="text-[11px] font-bold">{s.label}</span>
                    </button>
                  </form>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Resumen del equipo — solo lectura */}
      {players.filter(p => p.id !== selectedId && avail.has(p.id)).length > 0 && (
        <div className="px-3 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: '#637168' }}>
            Respuestas del equipo
          </p>
          <div className="flex flex-col gap-1.5">
            {players.filter(p => p.id !== selectedId && avail.has(p.id)).map(p => {
              const s = avail.get(p.id)!
              const cfg = STATUS_CONFIG[s]
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                  style={{ backgroundColor: '#111713', border: '1px solid #253028' }}>
                  <span className="text-xs font-black w-6 text-center flex-shrink-0" style={{ color: '#334155' }}>
                    {p.number ?? '·'}
                  </span>
                  <p className="text-sm flex-1 truncate" style={{ color: '#89968e' }}>{p.name}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Jugadoras sin respuesta */}
      {players.filter(p => p.id !== selectedId && !avail.has(p.id)).length > 0 && (
        <div className="px-3 pb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: '#334155' }}>
            Sin confirmar
          </p>
          <div className="flex flex-wrap gap-2 px-1">
            {players.filter(p => p.id !== selectedId && !avail.has(p.id)).map(p => (
              <span key={p.id} className="text-[11px] px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#111713', color: '#637168', border: '1px solid #253028' }}>
                {p.name.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="text-center pb-8">
        <p className="text-[10px]" style={{ color: '#334155' }}>Gestión de equipos con Coachly</p>
      </div>
    </div>
  )
}
