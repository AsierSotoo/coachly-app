'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { PlayerAvatar } from '@/components/team/player-avatar'
import {
  saveConvocatoriaPlayers,
  saveConvocatoriaMetadata,
  linkMatchToConvocatoria,
  unlinkMatchFromConvocatoria,
  type ConvocatoriaStatus,
} from '@/app/dashboard/season/[id]/convocatorias/actions'
import { getTeamTerms } from '@/lib/team-terms'
import { DownloadImageButton } from './download-image-button'

interface Player {
  id: string; name: string; number: number | null
  position: string | null; photo_url?: string | null
}
interface AvailableMatch { id: string; opponent: string; played_at: string; match_time?: string | null }
const YELLOW_WARNING = 4

interface Props {
  convocatoriaId: string; seasonId: string
  opponent: string; playedAt: string; teamName: string
  teamGender?: string | null
  logoUrl?: string | null
  seasonName?: string
  players: Player[]
  initial: Record<string, ConvocatoriaStatus>
  yellowCards?: Record<string, number>
  linkedMatchId: string | null
  availableMatches: AvailableMatch[]
  meetingTime?: string | null
  location?: string | null
}

export function ConvocatoriaEditor({
  convocatoriaId, seasonId, opponent, playedAt, teamName, teamGender,
  logoUrl, seasonName,
  players, initial, yellowCards = {}, linkedMatchId, availableMatches,
  meetingTime: initialMeetingTime, location: initialLocation,
}: Props) {
  const terms = getTeamTerms(teamGender)
  const [localMeetingTime, setLocalMeetingTime] = useState(initialMeetingTime ?? '')
  const [localLocation, setLocalLocation] = useState(initialLocation ?? '')
  const [statuses, setStatuses] = useState<Record<string, ConvocatoriaStatus>>(() => {
    const map: Record<string, ConvocatoriaStatus> = {}
    players.forEach(p => { map[p.id] = initial[p.id] ?? 'convocada' })
    return map
  })
  const [search, setSearch] = useState('')
  const [selectedMatch, setSelectedMatch] = useState(linkedMatchId ?? '')
  const [savePending, startSave] = useTransition()
  const [linkPending, startLink] = useTransition()
  const [copied, setCopied] = useState(false)

  const isInSquad = (id: string) => statuses[id] !== 'no_convocada'
  const add    = (id: string) => setStatuses(prev => ({ ...prev, [id]: 'convocada' }))
  const remove = (id: string) => setStatuses(prev => ({ ...prev, [id]: 'no_convocada' }))

  const squad       = players.filter(p => isInSquad(p.id))
  const squadCount  = squad.length
  const fueraCount  = players.filter(p => !isInSquad(p.id)).length
  const pct         = players.length > 0 ? Math.round((squadCount / players.length) * 100) : 0

  const filtered = search
    ? players.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        String(p.number ?? '').includes(search)
      )
    : players

  // Group by position using gender-aware order (normalises Portero↔Portera etc.)
  const groupedSquad: Record<string, Player[]> = {}
  for (const pos of terms.posOrder) {
    const g = squad.filter(p => {
      const norm = p.position ?? '__none__'
      // Match both gender variants to the same bucket
      if (pos === terms.positions[0]) return norm === 'Portera' || norm === 'Portero'
      if (pos === terms.positions[3]) return norm === 'Delantera' || norm === 'Delantero'
      return norm === pos
    })
    if (g.length > 0) groupedSquad[pos] = g
  }

  // Lista plana ordenada: GK→DEF→MID→FWD, sin cabeceras de sección
  const sortedSquad = [
    ...terms.posOrder.flatMap(pos =>
      (groupedSquad[pos] ?? []).slice().sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
    ),
    ...squad.filter(p => !p.position).sort((a, b) => (a.number ?? 99) - (b.number ?? 99)),
  ]

  // Numeración posicional para el PDF (esquema clásico de fútbol)
  const PRINT_NUMS: Record<string, number[]> = {
    gk:  [1, 13, 25],
    def: [2, 3, 4, 5],    // LD, LI, central, central
    mid: [6, 8, 10],      // pivote, interior, mediapunta
    fwd: [7, 9, 11],      // ED, delantero, EI
  }
  const posBucket = (pos: string | null): 'gk' | 'def' | 'mid' | 'fwd' | null => {
    if (!pos) return null
    const n = pos.toLowerCase()
    if (n.includes('porter')) return 'gk'
    if (n.includes('defens')) return 'def'
    if (n.includes('centrocampist') || n.includes('medio')) return 'mid'
    if (n.includes('delanter')) return 'fwd'
    return null
  }
  const printNumMap = new Map<string, number | null>()
  const posBuckets: Record<string, Player[]> = { gk: [], def: [], mid: [], fwd: [] }
  for (const p of sortedSquad) {
    const b = posBucket(p.position)
    if (b) posBuckets[b].push(p)
    else printNumMap.set(p.id, p.number)
  }
  // Primera pasada: asignar números posicionales de PRINT_NUMS
  const usedPrintNums = new Set<number>()
  const printOverflow: Player[] = []
  for (const [b, ps] of Object.entries(posBuckets)) {
    const nums = PRINT_NUMS[b]
    ps.forEach((p, i) => {
      if (i < nums.length) {
        usedPrintNums.add(nums[i])
        printNumMap.set(p.id, nums[i])
      } else {
        printOverflow.push(p)
      }
    })
  }
  // Segunda pasada: overflow usa el primer número libre del pool 1-30
  const printPool = Array.from({ length: 30 }, (_, i) => i + 1).filter(n => !usedPrintNums.has(n))
  printOverflow.forEach((p, i) => { printNumMap.set(p.id, printPool[i] ?? null) })

  const handleSave = () => {
    startSave(async () => {
      await Promise.all([
        saveConvocatoriaPlayers(
          convocatoriaId, seasonId,
          players.map(p => ({ playerId: p.id, status: statuses[p.id] }))
        ),
        saveConvocatoriaMetadata(
          convocatoriaId,
          localMeetingTime || null,
          localLocation || null,
          seasonId
        ),
      ])
      toast.success('Convocatoria guardada')
    })
  }

  const handleLink = () => {
    if (!selectedMatch) return
    startLink(async () => {
      await linkMatchToConvocatoria(convocatoriaId, selectedMatch, seasonId)
      toast.success('Vinculada al partido')
    })
  }

  const handleUnlink = () => {
    startLink(async () => {
      await unlinkMatchFromConvocatoria(convocatoriaId, seasonId)
      setSelectedMatch('')
      toast.success('Desvinculada')
    })
  }

  const handlePrint = () => {
    const el = document.querySelector<HTMLElement>('.print-convocatoria')
    if (!el) return
    const win = window.open('', '_blank', 'width=820,height=1160')
    if (!win) return
    win.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Convocatoria · ${teamName} vs ${opponent}</title>` +
      `<style>@page{size:A4 portrait;margin:1.5cm}body{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111713;background:white}</style>` +
      `</head><body>${el.innerHTML}</body></html>`
    )
    win.document.close()
    setTimeout(() => { win.focus(); win.print(); win.close() }, 300)
  }

  const handleCopy = async () => {
    const date = new Date(playedAt).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    const fmt = (p: Player) => `• ${p.number ? `#${p.number} ` : ''}${p.name}`
    const fuera = players.filter(p => !isInSquad(p.id))
    const lines = [
      '📋 CONVOCATORIA',
      `${teamName} vs ${opponent}`,
      `${date.charAt(0).toUpperCase() + date.slice(1)}`,
      ...(localMeetingTime ? [`⏰ Hora de convocatoria: ${localMeetingTime}`] : []),
      ...(localLocation ? [`📍 Lugar: ${localLocation}`] : []),
      '',
      `✅ ${terms.calleds.toUpperCase()} (${squadCount}):`,
      ...squad.map(fmt),
      ...(fuera.length > 0 ? ['', `❌ NO ${terms.calleds.toUpperCase()} (${fuera.length}):`, ...fuera.map(fmt)] : []),
      '', '📱 Coachly',
    ]
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    toast.success('Copiado', { description: 'Pégalo directamente en WhatsApp.' })
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <>
    <div className="flex flex-col gap-6">

      {/* ── Botones superiores ──────────────────────────────────────── */}
      <div className="flex justify-end gap-3">
        <DownloadImageButton
          targetClass="print-convocatoria"
          filename={`convocatoria-${opponent.toLowerCase().replace(/\s+/g, '-')}`}
        />
        <button type="button" onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold border active:scale-95 transition-all cursor-pointer"
          style={{ backgroundColor: '#1a231d', borderColor: '#2a342d', color: '#edf2ee' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>print</span>
          Imprimir
        </button>
        <button type="button" onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold border active:scale-95 transition-all cursor-pointer"
          style={{ backgroundColor: '#1a231d', borderColor: '#2a342d', color: '#edf2ee' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: copied ? 'var(--accent)' : undefined }}>
            {copied ? 'check' : 'content_copy'}
          </span>
          {copied ? 'Copiado' : 'Copiar lista'}
        </button>
        <button type="button" onClick={handleSave} disabled={savePending}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold active:scale-95 transition-all cursor-pointer disabled:opacity-60"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)', boxShadow: '0 0 15px rgba(34,197,94,0.25)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
          {savePending ? 'Guardando…' : 'Guardar Convocatoria'}
        </button>
      </div>

      {/* ── Hora y lugar ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#89968e' }}>
            Hora de convocatoria
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#89968e', fontSize: 16 }}>schedule</span>
            <input
              type="time"
              value={localMeetingTime}
              onChange={e => setLocalMeetingTime(e.target.value)}
              className="w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors"
              style={{ backgroundColor: '#111713', borderColor: '#2a342d', color: '#edf2ee' }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#89968e' }}>
            Lugar
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#89968e', fontSize: 16 }}>location_on</span>
            <input
              type="text"
              value={localLocation}
              onChange={e => setLocalLocation(e.target.value)}
              placeholder="Campo Municipal de Pamplona…"
              className="w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors"
              style={{ backgroundColor: '#111713', borderColor: '#2a342d', color: '#edf2ee' }}
            />
          </div>
        </div>
      </div>

      {/* ── Banner sanciones ────────────────────────────────────────── */}
      {(() => {
        const atRisk = players.filter(p => isInSquad(p.id) && (yellowCards[p.id] ?? 0) >= YELLOW_WARNING)
        if (atRisk.length === 0) return null
        return (
          <div className="flex items-start gap-3 rounded-xl border px-4 py-3"
            style={{ backgroundColor: 'rgba(250,204,21,0.05)', borderColor: 'rgba(250,204,21,0.25)' }}>
            <span className="material-symbols-outlined flex-shrink-0" style={{ color: '#facc15', fontSize: 20 }}>warning</span>
            <div>
              <p className="text-sm font-bold" style={{ color: '#facc15' }}>
                {atRisk.length === 1 ? '1 jugadora en riesgo de sanción' : `${atRisk.length} jugadoras en riesgo de sanción`}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#89968e' }}>
                {atRisk.map(p => `${p.name} (${yellowCards[p.id]}🟨)`).join(' · ')} — acumulan {YELLOW_WARNING}+ tarjetas esta temporada.
              </p>
            </div>
          </div>
        )
      })()}

      {/* ── Main: 2 columnas ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left: Tabla de jugadoras ─────────────────────────────── */}
        <div className="lg:col-span-7 rounded-2xl border overflow-hidden flex flex-col"
          style={{ backgroundColor: '#111713', borderColor: '#2a342d' }}>

          {/* Header con buscador */}
          <div className="flex items-center justify-between px-5 py-4 border-b"
            style={{ backgroundColor: '#0b100d', borderColor: '#253028' }}>
            <h3 className="text-[18px] font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              Plantilla Disponible
            </h3>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: '#89968e', fontSize: 18 }}>search</span>
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar jugadora..."
                className="border rounded-lg py-2 text-sm outline-none focus:border-[var(--accent)] transition-colors w-52"
                style={{ backgroundColor: '#171f1a', borderColor: '#2a342d', color: '#edf2ee', paddingLeft: 36, paddingRight: 16 }}
              />
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 480 }}>
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10" style={{ backgroundColor: '#111713' }}>
                <tr className="border-b" style={{ borderColor: '#253028' }}>
                  {['Jugadora', 'Pos', 'Status', 'Acción'].map((h, i) => (
                    <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: '#89968e', textAlign: i === 3 ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const inSquad = isInSquad(p.id)
                  return (
                    <tr key={p.id}
                      className="border-b last:border-0 transition-colors"
                      style={{ borderColor: 'rgba(46,52,71,0.3)', backgroundColor: inSquad ? 'rgba(34,197,94,0.04)' : 'transparent' }}>

                      {/* Jugadora */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border flex-shrink-0"
                            style={{ borderColor: inSquad ? 'rgba(34,197,94,0.3)' : '#2a342d', backgroundColor: '#1a231d' }}>
                            <PlayerAvatar name={p.name} photoUrl={p.photo_url} position={p.position ?? undefined} size="sm" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-white">{p.name}</p>
                              {(yellowCards[p.id] ?? 0) >= YELLOW_WARNING && (
                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black flex-shrink-0"
                                  style={{ backgroundColor: 'rgba(250,204,21,0.15)', color: '#facc15' }}>
                                  🟨{yellowCards[p.id]}
                                </span>
                              )}
                            </div>
                            {p.number !== null && (
                              <p className="text-[10px] font-bold uppercase" style={{ color: '#89968e' }}>
                                Dorsal {p.number}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Posición */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{
                            backgroundColor: inSquad ? 'rgba(34,197,94,0.1)' : '#1a231d',
                            color: inSquad ? 'var(--accent)' : '#89968e',
                          }}>
                          {terms.posAbbr(p.position)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        {inSquad ? (
                          <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>
                            check_circle
                          </span>
                        ) : (
                          <span className="material-symbols-outlined" style={{ color: 'rgba(173,180,206,0.3)', fontSize: 20 }}>
                            circle
                          </span>
                        )}
                      </td>

                      {/* Acción */}
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => inSquad ? remove(p.id) : add(p.id)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                          style={inSquad
                            ? { color: 'var(--accent)', backgroundColor: 'transparent' }
                            : { color: '#89968e', backgroundColor: 'transparent' }
                          }
                        >
                          {inSquad ? 'REMOVER' : 'AÑADIR'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right: Roster agrupado ───────────────────────────────── */}
        <div className="lg:col-span-5 flex flex-col">

          {/* Roster agrupado — ocupa toda la altura de la columna */}
          <div className="rounded-2xl border overflow-hidden flex flex-col flex-1"
            style={{ backgroundColor: '#171f1a', borderColor: '#2a342d' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b"
              style={{ backgroundColor: '#1a231d', borderColor: '#2a342d' }}>
              <h3 className="text-[18px] font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                Convocadas
              </h3>
              <div className="flex items-center gap-1">
                <span className="text-[24px] font-bold" style={{ color: 'var(--accent)', fontFamily: 'Sora, sans-serif' }}>{squadCount}</span>
                <span className="text-sm" style={{ color: '#89968e' }}>/ {players.length}</span>
              </div>
            </div>

            <ul className="p-4 overflow-y-auto space-y-0.5 flex-1 min-h-0">
              {sortedSquad.map(p => (
                <li key={p.id} className="group flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors hover:bg-[#1a231d]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 text-right text-[11px] font-bold flex-shrink-0" style={{ color: '#89968e' }}>
                      {p.number ?? '—'}
                    </span>
                    <span className="text-sm text-white truncate">{p.name}</span>
                    {(yellowCards[p.id] ?? 0) >= YELLOW_WARNING && (
                      <span className="text-[10px] flex-shrink-0" title={`${yellowCards[p.id]} tarjetas`}>🟨</span>
                    )}
                  </div>
                  <button type="button" onClick={() => remove(p.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity material-symbols-outlined cursor-pointer"
                    style={{ color: '#ffb4ab', fontSize: 16 }}>
                    close
                  </button>
                </li>
              ))}
              {squadCount === 0 && (
                <li className="text-center text-sm py-4 list-none" style={{ color: '#89968e' }}>
                  Añade jugadoras desde la tabla
                </li>
              )}
            </ul>
          </div>

        </div>
      </div>

      {/* ── Footer: stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: 'groups',       value: squadCount,           label: 'Total Convocadas' },
          { icon: 'person_remove', value: fueraCount,          label: 'Fuera del Roster' },
          { icon: 'sports_soccer', value: `${pct}%`,           label: 'Del Equipo Conv.' },
          { icon: 'link',          value: linkedMatchId ? 1 : 0, label: linkedMatchId ? 'Partido Vinculado' : 'Sin Partido' },
        ].map(({ icon, value, label }) => (
          <div key={label} className="flex items-center gap-4 rounded-xl border p-4"
            style={{ backgroundColor: '#111713', borderColor: '#2a342d' }}>
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 20 }}>{icon}</span>
            </div>
            <div>
              <p className="text-[20px] font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#89968e' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Vincular partido ────────────────────────────────────────── */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#111713', borderColor: '#253028' }}>
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: '#253028' }}>
          <span className="material-symbols-outlined" style={{ color: '#89968e', fontSize: 18 }}>link</span>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#89968e' }}>Vincular a partido registrado</p>
        </div>
        <div className="p-5">
          {linkedMatchId ? (
            <div className="flex items-center justify-between rounded-xl border px-4 py-3"
              style={{ backgroundColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)' }}>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Partido vinculado</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#89968e' }}>El partido usará esta convocatoria al registrar estadísticas</p>
              </div>
              <button type="button" onClick={handleUnlink} disabled={linkPending}
                className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs cursor-pointer transition-colors hover:border-red-500/40 hover:text-red-400"
                style={{ borderColor: '#2a342d', color: '#89968e' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>link_off</span> Desvincular
              </button>
            </div>
          ) : availableMatches.length > 0 ? (
            <div className="flex gap-3">
              <select value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)}
                className="flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none appearance-none focus:border-[var(--accent)] transition-colors"
                style={{ backgroundColor: '#090e0b', borderColor: '#2a342d', color: '#edf2ee' }}>
                <option value="">Selecciona un partido…</option>
                {availableMatches.map(m => (
                  <option key={m.id} value={m.id}>
                    vs {m.opponent} · {new Date(m.played_at + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}{m.match_time ? ` · ${m.match_time.slice(0, 5)}h` : ''}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleLink} disabled={!selectedMatch || linkPending}
                className="flex items-center gap-2 px-5 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-40 transition-all active:scale-95"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>link</span> Vincular
              </button>
            </div>
          ) : (
            <p className="text-sm py-1" style={{ color: '#89968e' }}>No hay partidos disponibles para vincular en esta temporada.</p>
          )}
        </div>
      </div>

    </div>

    {/* ── HOJA DE IMPRESIÓN ─────────────────────────────────────────────────── */}
    <div className="print-convocatoria" style={{ padding: '2rem 2.5rem', borderRadius: 16 }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '3px solid #16a34a' }}>
        {/* Escudo + nombre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {logoUrl && (
            <img src={logoUrl} alt={teamName}
              style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', padding: 4 }} />
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#111713', letterSpacing: '-0.02em' }}>
              {teamName}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#637168', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
              CONVOCATORIA OFICIAL
            </p>
            {seasonName && (
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>{seasonName}</p>
            )}
          </div>
        </div>

        {/* Info partido */}
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111713' }}>vs {opponent}</p>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#637168' }}>
            {new Date(playedAt).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {localMeetingTime && (
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#111713', fontWeight: 600 }}>
              ⏰ Convocatoria: {localMeetingTime} h
            </p>
          )}
          {localLocation && (
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#637168' }}>
              📍 {localLocation}
            </p>
          )}
          <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
            {squadCount} {terms.calleds}
          </p>
        </div>
      </div>

      {/* Sin leyenda — la imagen es solo para compartir con la plantilla */}

      {/* Jugadoras — lista plana en 2 columnas, ordenadas GK→DEF→MID→FWD */}
      <div style={{ columns: 2, gap: '2rem', marginTop: '0.5rem' }}>
        {sortedSquad.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.3rem 0.5rem', marginBottom: 2, breakInside: 'avoid' }}>
            <span style={{ width: 24, textAlign: 'right', fontWeight: 700, color: '#94a3b8', fontSize: '0.8rem', flexShrink: 0 }}>
              {printNumMap.get(p.id) ?? '—'}
            </span>
            <span style={{ flex: 1, color: '#111713', fontSize: '0.875rem' }}>
              {p.name}
            </span>
          </div>
        ))}
      </div>

      {/* No convocadas */}
      {fueraCount > 0 && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8' }}>
            No convocadas ({fueraCount})
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
            {players.filter(p => !isInSquad(p.id)).sort((a, b) => (a.number ?? 99) - (b.number ?? 99)).map(p => `${p.number ? `${p.number} ` : ''}${p.name}`).join(' · ')}
          </p>
        </div>
      )}

      {/* Pie */}
      <div style={{ marginTop: '2rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
        <span>Total convocadas: <strong style={{ color: '#111713' }}>{squadCount}</strong></span>
        <span>Generado con Coachly · coachly.app</span>
      </div>
    </div>
    </>
  )
}

