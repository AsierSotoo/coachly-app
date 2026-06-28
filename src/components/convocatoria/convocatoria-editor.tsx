'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { PlayerAvatar } from '@/components/team/player-avatar'
import {
  saveConvocatoriaPlayers,
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
interface AvailableMatch { id: string; opponent: string; played_at: string }
interface Props {
  convocatoriaId: string; seasonId: string
  opponent: string; playedAt: string; teamName: string
  teamGender?: string | null
  logoUrl?: string | null
  seasonName?: string
  players: Player[]
  initial: Record<string, ConvocatoriaStatus>
  linkedMatchId: string | null
  availableMatches: AvailableMatch[]
}

export function ConvocatoriaEditor({
  convocatoriaId, seasonId, opponent, playedAt, teamName, teamGender,
  logoUrl, seasonName,
  players, initial, linkedMatchId, availableMatches,
}: Props) {
  const terms = getTeamTerms(teamGender)
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

  const gkCount = squad.filter(p => p.position === 'Portera' || p.position === 'Portero').length
  const dfCount = squad.filter(p => p.position === 'Defensa').length
  const mcCount = squad.filter(p => p.position === 'Centrocampista').length
  const dlCount = squad.filter(p => p.position === 'Delantera' || p.position === 'Delantero').length

  const handleSave = () => {
    startSave(async () => {
      await saveConvocatoriaPlayers(
        convocatoriaId, seasonId,
        players.map(p => ({ playerId: p.id, status: statuses[p.id] }))
      )
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

  const handleCopy = async () => {
    const date = new Date(playedAt).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    const fmt = (p: Player) => `• ${p.number ? `#${p.number} ` : ''}${p.name}`
    const fuera = players.filter(p => !isInSquad(p.id))
    const lines = [
      '📋 CONVOCATORIA',
      `${teamName} vs ${opponent}`,
      `${date.charAt(0).toUpperCase() + date.slice(1)}`, '',
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
        <button type="button" onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold border active:scale-95 transition-all cursor-pointer"
          style={{ backgroundColor: '#23293c', borderColor: '#2e3447', color: '#dce1fb' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>print</span>
          Imprimir
        </button>
        <button type="button" onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold border active:scale-95 transition-all cursor-pointer"
          style={{ backgroundColor: '#23293c', borderColor: '#2e3447', color: '#dce1fb' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: copied ? '#4be277' : undefined }}>
            {copied ? 'check' : 'content_copy'}
          </span>
          {copied ? 'Copiado' : 'Copiar lista'}
        </button>
        <button type="button" onClick={handleSave} disabled={savePending}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold active:scale-95 transition-all cursor-pointer disabled:opacity-60"
          style={{ backgroundColor: '#22c55e', color: '#003915', boxShadow: '0 0 15px rgba(34,197,94,0.25)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
          {savePending ? 'Guardando…' : 'Guardar Convocatoria'}
        </button>
      </div>

      {/* ── Main: 2 columnas ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left: Tabla de jugadoras ─────────────────────────────── */}
        <div className="lg:col-span-7 rounded-[24px] border overflow-hidden flex flex-col"
          style={{ backgroundColor: '#151b2d', borderColor: '#2e3447' }}>

          {/* Header con buscador */}
          <div className="flex items-center justify-between px-5 py-4 border-b"
            style={{ backgroundColor: '#070d1f', borderColor: '#1e293b' }}>
            <h3 className="text-[18px] font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              Plantilla Disponible
            </h3>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: '#adb4ce', fontSize: 18 }}>search</span>
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar jugadora..."
                className="border rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-[#4be277] transition-colors w-52"
                style={{ backgroundColor: '#191f31', borderColor: '#2e3447', color: '#dce1fb' }}
              />
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 480 }}>
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10" style={{ backgroundColor: '#151b2d' }}>
                <tr className="border-b" style={{ borderColor: '#1e293b' }}>
                  {['Jugadora', 'Pos', 'Status', 'Acción'].map((h, i) => (
                    <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: '#adb4ce', textAlign: i === 3 ? 'right' : 'left' }}>{h}</th>
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
                            style={{ borderColor: inSquad ? 'rgba(34,197,94,0.3)' : '#2e3447', backgroundColor: '#23293c' }}>
                            <PlayerAvatar name={p.name} photoUrl={p.photo_url} position={p.position ?? undefined} size="sm" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{p.name}</p>
                            {p.number !== null && (
                              <p className="text-[10px] font-bold uppercase" style={{ color: '#adb4ce' }}>
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
                            backgroundColor: inSquad ? 'rgba(34,197,94,0.1)' : '#23293c',
                            color: inSquad ? '#4be277' : '#adb4ce',
                          }}>
                          {terms.posAbbr(p.position)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        {inSquad ? (
                          <span className="material-symbols-outlined" style={{ color: '#4be277', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>
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
                            ? { color: '#4be277', backgroundColor: 'transparent' }
                            : { color: '#adb4ce', backgroundColor: 'transparent' }
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

        {/* ── Right: Roster agrupado + Mini campo ──────────────────── */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* Roster agrupado */}
          <div className="rounded-[24px] border overflow-hidden flex flex-col"
            style={{ backgroundColor: '#191f31', borderColor: '#2e3447' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b"
              style={{ backgroundColor: '#23293c', borderColor: '#2e3447' }}>
              <h3 className="text-[18px] font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                Convocadas
              </h3>
              <div className="flex items-center gap-1">
                <span className="text-[24px] font-bold" style={{ color: '#4be277', fontFamily: 'Sora, sans-serif' }}>{squadCount}</span>
                <span className="text-sm" style={{ color: '#adb4ce' }}>/ {players.length}</span>
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-4" style={{ maxHeight: 280 }}>
              {terms.posOrder.map(pos => {
                const group = groupedSquad[pos]
                if (!group?.length) return null
                return (
                  <div key={pos}>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] pb-1 mb-2 border-b"
                      style={{ color: '#adb4ce', borderColor: 'rgba(46,52,71,0.3)' }}>
                      {terms.posLabelPlural(pos)} ({group.length})
                    </h4>
                    <ul className="space-y-1">
                      {group.map(p => (
                        <li key={p.id} className="group flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors hover:bg-[#23293c]">
                          <div className="flex items-center gap-2">
                            <span className="w-5 text-right text-[11px] font-bold flex-shrink-0" style={{ color: '#adb4ce' }}>
                              {p.number ?? '—'}
                            </span>
                            <span className="text-sm text-white">{p.name}</span>
                          </div>
                          <button type="button" onClick={() => remove(p.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity material-symbols-outlined cursor-pointer"
                            style={{ color: '#ffb4ab', fontSize: 16 }}>
                            close
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
              {squadCount === 0 && (
                <p className="text-center text-sm py-4" style={{ color: '#adb4ce' }}>
                  Añade jugadoras desde la tabla
                </p>
              )}
            </div>
          </div>

          {/* Mini campo táctico */}
          <div className="rounded-[24px] border p-5 relative overflow-hidden"
            style={{ backgroundColor: '#0f172a', borderColor: '#1e293b', height: 200 }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>
                Distribución Táctica
              </p>
              <span className="text-[10px] font-bold" style={{ color: '#4be277' }}>
                {gkCount}-{dfCount}-{mcCount}-{dlCount}
              </span>
            </div>

            {/* Líneas del campo */}
            <div className="absolute inset-x-6 bottom-4 top-14 pointer-events-none opacity-15">
              <div className="absolute inset-0 border border-white rounded-lg" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white -translate-x-1/2" style={{ display: 'none' }} />
              <div className="absolute bottom-0 left-1/4 right-1/4 h-14 border border-white" />
            </div>

            {/* Puntos de jugadoras */}
            <div className="absolute inset-x-6 bottom-4 top-14 pointer-events-none">
              {/* GK */}
              {Array.from({ length: Math.min(gkCount, 1) }).map((_, i) => (
                <div key={`gk${i}`} className="absolute w-4 h-4 rounded-full"
                  style={{ backgroundColor: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.6)', bottom: 8, left: '50%', transform: 'translateX(-50%)' }} />
              ))}
              {/* DF */}
              {Array.from({ length: Math.min(dfCount, 5) }).map((_, i, arr) => (
                <div key={`df${i}`} className="absolute w-3 h-3 rounded-full"
                  style={{ backgroundColor: 'rgba(34,197,94,0.65)', bottom: 44, left: `${((i + 1) / (arr.length + 1)) * 100}%`, transform: 'translateX(-50%)' }} />
              ))}
              {/* MC */}
              {Array.from({ length: Math.min(mcCount, 5) }).map((_, i, arr) => (
                <div key={`mc${i}`} className="absolute w-3 h-3 rounded-full"
                  style={{ backgroundColor: 'rgba(34,197,94,0.4)', bottom: 82, left: `${((i + 1) / (arr.length + 1)) * 100}%`, transform: 'translateX(-50%)' }} />
              ))}
              {/* DL */}
              {Array.from({ length: Math.min(dlCount, 4) }).map((_, i, arr) => (
                <div key={`dl${i}`} className="absolute w-3 h-3 rounded-full"
                  style={{ backgroundColor: 'rgba(34,197,94,0.2)', bottom: 116, left: `${((i + 1) / (arr.length + 1)) * 100}%`, transform: 'translateX(-50%)' }} />
              ))}
            </div>
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
            style={{ backgroundColor: '#151b2d', borderColor: '#2e3447' }}>
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
              <span className="material-symbols-outlined" style={{ color: '#4be277', fontSize: 20 }}>{icon}</span>
            </div>
            <div>
              <p className="text-[20px] font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#adb4ce' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Vincular partido ────────────────────────────────────────── */}
      <div className="rounded-[24px] border overflow-hidden" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: '#1e293b' }}>
          <span className="material-symbols-outlined" style={{ color: '#adb4ce', fontSize: 18 }}>link</span>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#adb4ce' }}>Vincular a partido registrado</p>
        </div>
        <div className="p-5">
          {linkedMatchId ? (
            <div className="flex items-center justify-between rounded-xl border px-4 py-3"
              style={{ backgroundColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)' }}>
              <div>
                <p className="text-xs font-semibold" style={{ color: '#4be277' }}>Partido vinculado</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#adb4ce' }}>El partido usará esta convocatoria al registrar estadísticas</p>
              </div>
              <button type="button" onClick={handleUnlink} disabled={linkPending}
                className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs cursor-pointer transition-colors hover:border-red-500/40 hover:text-red-400"
                style={{ borderColor: '#2e3447', color: '#adb4ce' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>link_off</span> Desvincular
              </button>
            </div>
          ) : availableMatches.length > 0 ? (
            <div className="flex gap-3">
              <select value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)}
                className="flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none appearance-none focus:border-[#4be277] transition-colors"
                style={{ backgroundColor: '#0c1324', borderColor: '#2e3447', color: '#dce1fb' }}>
                <option value="">Selecciona un partido…</option>
                {availableMatches.map(m => (
                  <option key={m.id} value={m.id}>
                    vs {m.opponent} · {new Date(m.played_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleLink} disabled={!selectedMatch || linkPending}
                className="flex items-center gap-2 px-5 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-40 transition-all active:scale-95"
                style={{ backgroundColor: '#22c55e', color: '#003915' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>link</span> Vincular
              </button>
            </div>
          ) : (
            <p className="text-sm py-1" style={{ color: '#adb4ce' }}>No hay partidos disponibles para vincular en esta temporada.</p>
          )}
        </div>
      </div>

    </div>

    {/* ── HOJA DE IMPRESIÓN ─────────────────────────────────────────────────── */}
    <div className="print-convocatoria">
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '3px solid #16a34a' }}>
        {/* Escudo + nombre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {logoUrl && (
            <img src={logoUrl} alt={teamName}
              style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', padding: 4 }} />
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {teamName}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
              CONVOCATORIA OFICIAL
            </p>
            {seasonName && (
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>{seasonName}</p>
            )}
          </div>
        </div>

        {/* Info partido */}
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>vs {opponent}</p>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#475569' }}>
            {new Date(playedAt).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
            {squadCount} {terms.calleds}
          </p>
        </div>
      </div>

      {/* Leyenda */}
      {squad.some(p => statuses[p.id] === 'titular') && (
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.7rem', color: '#64748b' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ background: '#16a34a', color: 'white', padding: '1px 6px', borderRadius: 4, fontWeight: 700, fontSize: '0.65rem' }}>TIT</span>
            Titular
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ background: '#e2e8f0', color: '#475569', padding: '1px 6px', borderRadius: 4, fontWeight: 700, fontSize: '0.65rem' }}>SUP</span>
            Suplente / Convocada
          </span>
        </div>
      )}

      {/* Jugadoras por posición */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem 2rem' }}>
        {terms.posOrder.map(pos => {
          const group = groupedSquad[pos]
          if (!group?.length) return null
          const sorted = [...group].sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
          return (
            <div key={pos}>
              <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#16a34a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem' }}>
                {terms.posLabelPlural(pos)} ({group.length})
              </h2>
              <div>
                {sorted.map(p => {
                  const isTitular = statuses[p.id] === 'titular'
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.3rem 0.5rem', marginBottom: 2, borderRadius: 4, background: isTitular ? '#f0fdf4' : 'transparent', borderLeft: isTitular ? '3px solid #16a34a' : '3px solid transparent' }}>
                      <span style={{ width: 24, textAlign: 'right', fontWeight: 700, color: '#94a3b8', fontSize: '0.8rem', flexShrink: 0 }}>
                        {p.number !== null ? p.number : '—'}
                      </span>
                      <span style={{ flex: 1, fontWeight: isTitular ? 700 : 400, color: '#0f172a', fontSize: '0.875rem' }}>
                        {p.name}
                      </span>
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: isTitular ? '#16a34a' : '#e2e8f0', color: isTitular ? 'white' : '#64748b', flexShrink: 0 }}>
                        {isTitular ? 'TIT' : 'SUP'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Sin posición */}
        {(() => {
          const noPos = squad.filter(p => !p.position).sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
          if (!noPos.length) return null
          return (
            <div key="nopos">
              <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem' }}>
                Sin posición ({noPos.length})
              </h2>
              {noPos.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.3rem 0.5rem', marginBottom: 2, borderLeft: '3px solid transparent' }}>
                  <span style={{ width: 24, textAlign: 'right', fontWeight: 700, color: '#94a3b8', fontSize: '0.8rem' }}>{p.number ?? '—'}</span>
                  <span style={{ flex: 1, color: '#0f172a', fontSize: '0.875rem' }}>{p.name}</span>
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      {/* No convocadas */}
      {fueraCount > 0 && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8' }}>
            No convocadas ({fueraCount})
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
            {players.filter(p => !isInSquad(p.id)).sort((a, b) => (a.number ?? 99) - (b.number ?? 99)).map(p => `${p.number ? `#${p.number} ` : ''}${p.name}`).join(' · ')}
          </p>
        </div>
      )}

      {/* Pie */}
      <div style={{ marginTop: '2rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
        <span>Total convocadas: <strong style={{ color: '#0f172a' }}>{squadCount}</strong></span>
        <span>Generado con Coachly · coachly.app</span>
      </div>
    </div>
    </>
  )
}

