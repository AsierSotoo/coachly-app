'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { saveConvocatoriaPlayers } from '@/app/dashboard/season/[id]/convocatorias/actions'
import { ensureMatchConvocatoria } from '@/app/dashboard/season/actions'

type Status = 'titular' | 'convocada' | 'no_convocada' | null

interface Player {
  id: string
  name: string
  number: number | null
  position: string | null
}

interface Props {
  matchId: string
  seasonId: string
  opponent: string
  playedAt: string
  convocatoriaId: string | null
  players: Player[]
  initialStatuses: Record<string, Status>
}

const CYCLE: (Status)[] = [null, 'titular', 'convocada']

export function PreMatchLineupPicker({
  matchId, seasonId, opponent, playedAt,
  convocatoriaId: initialConvId,
  players, initialStatuses,
}: Props) {
  const [convId, setConvId] = useState<string | null>(initialConvId)
  const [statuses, setStatuses] = useState<Record<string, Status>>(initialStatuses)
  const [, startTransition] = useTransition()

  const titulares = players.filter(p => statuses[p.id] === 'titular').length
  const suplentes = players.filter(p => statuses[p.id] === 'convocada').length

  function toggle(playerId: string) {
    const current = statuses[playerId] ?? null
    const idx = CYCLE.indexOf(current)
    const next = CYCLE[(idx + 1) % CYCLE.length]
    const newStatuses = { ...statuses, [playerId]: next }
    setStatuses(newStatuses)

    startTransition(async () => {
      try {
        let cid = convId
        if (!cid) {
          cid = await ensureMatchConvocatoria(matchId, seasonId, opponent, playedAt)
          setConvId(cid)
        }
        const entries = players.map(p => ({
          playerId: p.id,
          status: (newStatuses[p.id] ?? 'no_convocada') as 'titular' | 'convocada' | 'no_convocada',
        }))
        await saveConvocatoriaPlayers(cid, seasonId, entries)
      } catch (e) {
        toast.error('Error al guardar: ' + (e instanceof Error ? e.message : String(e)))
        setStatuses(prev => ({ ...prev, [playerId]: statuses[playerId] }))
      }
    })
  }

  // Sort: titulares → suplentes → sin asignar, then by number
  const sorted = [...players].sort((a, b) => {
    const ORDER: Record<string, number> = { titular: 0, convocada: 1, no_convocada: 2 }
    const aO = ORDER[statuses[a.id] ?? 'no_convocada'] ?? 2
    const bO = ORDER[statuses[b.id] ?? 'no_convocada'] ?? 2
    if (aO !== bO) return aO - bO
    return (a.number ?? 99) - (b.number ?? 99)
  })

  return (
    <section className="rounded-2xl border overflow-hidden mb-6"
      style={{ borderColor: 'var(--bdr-strong)', backgroundColor: 'var(--bg-card)' }}>

      <div className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: 'var(--bdr-strong)', backgroundColor: 'var(--bg-card)' }}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--accent)' }}>sports_soccer</span>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--tx-2)' }}>
            Alineación previa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold tabular-nums"
            style={{ color: titulares === 11 ? '#72e697' : titulares > 0 ? 'var(--tx-2)' : 'var(--tx-4)' }}>
            {titulares}/11 titulares
          </span>
          {suplentes > 0 && (
            <span className="text-[10px] font-semibold" style={{ color: '#60a5fa' }}>
              · {suplentes} sup
            </span>
          )}
        </div>
      </div>

      <div>
        {sorted.map(p => {
          const s = statuses[p.id] ?? null
          const isTitular = s === 'titular'
          const isSuplente = s === 'convocada'
          return (
            <div key={p.id}
              onClick={() => toggle(p.id)}
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors select-none border-b last:border-0"
              style={{
                borderColor: 'var(--bdr)',
                backgroundColor: isTitular ? 'rgba(114,230,151,0.06)' : 'transparent',
              }}>
              <span className="text-[11px] font-black w-5 text-right tabular-nums shrink-0"
                style={{ color: 'var(--tx-3)' }}>
                {p.number ?? '—'}
              </span>
              <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--tx)' }}>
                {p.name}
              </span>
              {s ? (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{
                  color: isTitular ? '#72e697' : isSuplente ? '#60a5fa' : 'var(--tx-4)',
                  backgroundColor: isTitular ? 'rgba(114,230,151,0.15)' : isSuplente ? 'rgba(96,165,250,0.12)' : 'var(--bg-elevated)',
                }}>
                  {isTitular ? 'TITULAR' : 'SUPLENTE'}
                </span>
              ) : (
                <span className="text-[9px] font-medium px-2 py-0.5 rounded-full shrink-0"
                  style={{ color: 'var(--tx-4)', backgroundColor: 'var(--bg-elevated)' }}>
                  —
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="px-4 py-2 border-t" style={{ borderColor: 'var(--bdr-strong)' }}>
        <p className="text-[9px]" style={{ color: 'var(--tx-4)' }}>
          Toca para asignar: — → Titular → Suplente → —
        </p>
      </div>
    </section>
  )
}
