'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { PlayerAvatar } from '@/components/team/player-avatar'
import { saveTrainingAttendance } from '@/app/dashboard/season/[id]/trainings/actions'

interface Player {
  id: string; name: string; number: number | null
  position: string | null; photo_url?: string | null
}
interface AttendanceEntry {
  attended: boolean; reason: string | null
}
interface Props {
  sessionId: string; seasonId: string; players: Player[]
  initial: Record<string, AttendanceEntry>
}

const PRESET_REASONS = ['Lesión', 'Enfermedad', 'Trabajo / Estudios', 'Personal', 'Sin justificar']

function PlayerRow({
  player,
  entry,
  onChange,
}: {
  player: Player
  entry: AttendanceEntry
  onChange: (e: AttendanceEntry) => void
}) {
  const isOther = !entry.attended && entry.reason !== null && !PRESET_REASONS.includes(entry.reason)
  const selectValue = isOther ? 'Otra...' : (entry.reason ?? '')

  return (
    <li className="px-4 py-3 border-b last:border-0" style={{ borderColor: '#1e293b' }}>
      {/* Fila principal */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-lg overflow-hidden border flex-shrink-0" style={{ borderColor: '#2e3447', backgroundColor: '#23293c' }}>
          <PlayerAvatar name={player.name} photoUrl={player.photo_url} position={player.position ?? undefined} size="sm" />
        </div>

        {/* Nombre + dorsal */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{player.name}</p>
          {player.number !== null && (
            <p className="text-[10px]" style={{ color: '#475569' }}>#{player.number}</p>
          )}
        </div>

        {/* Toggles Presente / Ausente */}
        <div className="flex rounded-xl overflow-hidden border flex-shrink-0" style={{ borderColor: '#2e3447' }}>
          <button
            type="button"
            onClick={() => onChange({ attended: true, reason: null })}
            className="flex items-center gap-1 px-3 py-2.5 text-xs font-bold transition-all"
            style={{
              backgroundColor: entry.attended ? '#16a34a' : '#151b2d',
              color: entry.attended ? 'white' : '#475569',
              minHeight: 44,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: entry.attended ? "'FILL' 1" : "'FILL' 0" }}>
              check_circle
            </span>
            <span className="hidden sm:inline">Presente</span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ attended: false, reason: null })}
            className="flex items-center gap-1 px-3 py-2.5 text-xs font-bold transition-all border-l"
            style={{
              backgroundColor: !entry.attended ? 'rgba(239,68,68,0.15)' : '#151b2d',
              color: !entry.attended ? '#f87171' : '#475569',
              borderColor: '#2e3447',
              minHeight: 44,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: !entry.attended ? "'FILL' 1" : "'FILL' 0" }}>
              cancel
            </span>
            <span className="hidden sm:inline">Ausente</span>
          </button>
        </div>
      </div>

      {/* Motivo — solo si ausente */}
      {!entry.attended && (
        <div className="mt-2.5 ml-12 flex flex-wrap gap-2 items-center">
          {/* Chips de razones predefinidas */}
          {PRESET_REASONS.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => onChange({ attended: false, reason: r })}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all"
              style={{
                backgroundColor: selectValue === r ? 'rgba(239,68,68,0.15)' : '#151b2d',
                borderColor: selectValue === r ? 'rgba(239,68,68,0.4)' : '#2e3447',
                color: selectValue === r ? '#f87171' : '#475569',
              }}
            >
              {r}
            </button>
          ))}

          {/* Chip "Otra..." */}
          <button
            type="button"
            onClick={() => onChange({ attended: false, reason: isOther ? entry.reason : '' })}
            className="px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all"
            style={{
              backgroundColor: isOther ? 'rgba(239,68,68,0.15)' : '#151b2d',
              borderColor: isOther ? 'rgba(239,68,68,0.4)' : '#2e3447',
              color: isOther ? '#f87171' : '#475569',
            }}
          >
            Otra...
          </button>

          {/* Input texto libre cuando "Otra" está activa */}
          {isOther && (
            <input
              type="text"
              autoFocus
              placeholder="Escribe el motivo..."
              value={entry.reason ?? ''}
              onChange={e => onChange({ attended: false, reason: e.target.value })}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none transition-colors"
              style={{
                backgroundColor: '#151b2d', borderColor: '#2e3447', color: '#dce1fb',
                minHeight: 'auto', fontSize: 14,
              }}
            />
          )}
        </div>
      )}
    </li>
  )
}

export function TrainingAttendance({ sessionId, seasonId, players, initial }: Props) {
  const [entries, setEntries] = useState<Record<string, AttendanceEntry>>(() => {
    const map: Record<string, AttendanceEntry> = {}
    players.forEach(p => {
      map[p.id] = initial[p.id] ?? { attended: true, reason: null }
    })
    return map
  })
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const presentCount = Object.values(entries).filter(e => e.attended).length
  const absentCount  = players.length - presentCount
  const allMarked    = true // siempre true — los no tocados cuentan como presentes por defecto

  const handleSave = () => {
    startTransition(async () => {
      await saveTrainingAttendance(
        sessionId,
        seasonId,
        players.map(p => ({ playerId: p.id, ...entries[p.id] }))
      )
      setSaved(true)
      toast.success('Asistencia guardada')
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: '#1e293b', backgroundColor: '#151b2d' }}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ color: '#adb4ce', fontSize: 18 }}>groups</span>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>Asistencia</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#4be277' }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#16a34a' }} />
            {presentCount} presentes
          </span>
          {absentCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#f87171' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ef4444' }} />
              {absentCount} ausentes
            </span>
          )}
          {saved && <span className="text-xs font-bold" style={{ color: '#4be277' }}>✓ Guardado</span>}
        </div>
      </div>

      {/* Lista jugadoras */}
      <ul>
        {players.map(p => (
          <PlayerRow
            key={p.id}
            player={p}
            entry={entries[p.id]}
            onChange={e => setEntries(prev => ({ ...prev, [p.id]: e }))}
          />
        ))}
      </ul>

      {/* Footer guardar */}
      <div className="px-4 py-3 border-t" style={{ borderColor: '#1e293b' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60"
          style={{ backgroundColor: '#22c55e', color: '#003915' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
          {pending ? 'Guardando…' : 'Guardar asistencia'}
        </button>
      </div>
    </div>
  )
}
