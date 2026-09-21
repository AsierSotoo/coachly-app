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
    <li className="px-4 py-3 border-b last:border-0" style={{ borderColor: 'var(--bdr)' }}>
      {/* Fila principal */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-lg overflow-hidden border flex-shrink-0" style={{ borderColor: 'var(--bdr)', backgroundColor: 'var(--bg-elevated)' }}>
          <PlayerAvatar name={player.name} photoUrl={player.photo_url} position={player.position ?? undefined} size="sm" />
        </div>

        {/* Nombre + dorsal */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--tx)' }}>{player.name}</p>
          {player.number !== null && (
            <p className="text-[10px]" style={{ color: 'var(--tx-3)' }}>#{player.number}</p>
          )}
        </div>

        {/* Toggles Presente / Ausente */}
        <div className="flex rounded-xl overflow-hidden border flex-shrink-0" style={{ borderColor: 'var(--bdr)' }}>
          <button
            type="button"
            onClick={() => onChange({ attended: true, reason: null })}
            className="flex items-center gap-1 px-3 py-2.5 text-xs font-bold transition-all"
            style={{
              backgroundColor: entry.attended ? 'var(--accent)' : 'transparent',
              color: entry.attended ? 'var(--accent-fg)' : 'var(--tx-3)',
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
              backgroundColor: !entry.attended ? 'var(--c-danger-bg)' : 'transparent',
              color: !entry.attended ? 'var(--c-danger)' : 'var(--tx-3)',
              borderColor: 'var(--bdr)',
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
                backgroundColor: selectValue === r ? 'var(--c-danger-bg)' : 'transparent',
                borderColor: selectValue === r ? 'var(--c-danger-bdr)' : 'var(--bdr)',
                color: selectValue === r ? 'var(--c-danger)' : 'var(--tx-3)',
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
              backgroundColor: isOther ? 'var(--c-danger-bg)' : 'transparent',
              borderColor: isOther ? 'var(--c-danger-bdr)' : 'var(--bdr)',
              color: isOther ? 'var(--c-danger)' : 'var(--tx-3)',
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
                backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr)', color: 'var(--tx)',
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
    <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: 'var(--bdr)', backgroundColor: 'var(--bg-card-2)' }}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ color: 'var(--tx-2)', fontSize: 18 }}>groups</span>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--tx-2)' }}>Asistencia</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--accent)' }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
            {presentCount} presentes
          </span>
          {absentCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--c-danger)' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--c-danger)' }} />
              {absentCount} ausentes
            </span>
          )}
          {saved && <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>✓ Guardado</span>}
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
      <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--bdr)' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
          {pending ? 'Guardando…' : 'Guardar asistencia'}
        </button>
      </div>
    </div>
  )
}
