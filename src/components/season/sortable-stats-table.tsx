'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PlayerAvatar } from '@/components/team/player-avatar'

const YELLOW_WARNING = 4

type PlayerStat = {
  playerId: string
  name: string
  number: number | null
  position: string | null
  photoUrl: string | null
  goals: number
  assists: number
  minutes: number
  yellowCards: number
  redCards: number
  gamesPlayed: number
}

type SortKey = 'goals' | 'assists' | 'gamesPlayed' | 'minutes' | 'g90' | 'ga' | 'yellowCards' | 'redCards'

const DEFAULT_SORT: SortKey = 'goals'

function computeG90(s: PlayerStat) {
  return s.minutes >= 45 ? (s.goals / s.minutes) * 90 : -1
}

function sortStats(stats: PlayerStat[], key: SortKey, desc: boolean): PlayerStat[] {
  return [...stats].sort((a, b) => {
    let va = 0, vb = 0
    if (key === 'goals')      { va = a.goals;      vb = b.goals }
    else if (key === 'assists')    { va = a.assists;    vb = b.assists }
    else if (key === 'gamesPlayed'){ va = a.gamesPlayed; vb = b.gamesPlayed }
    else if (key === 'minutes')    { va = a.minutes;    vb = b.minutes }
    else if (key === 'ga')         { va = a.goals + a.assists; vb = b.goals + b.assists }
    else if (key === 'g90')        { va = computeG90(a); vb = computeG90(b) }
    else if (key === 'yellowCards'){ va = a.yellowCards; vb = b.yellowCards }
    else if (key === 'redCards')   { va = a.redCards;   vb = b.redCards }
    return desc ? vb - va : va - vb
  })
}

export function SortableStatsTable({ stats, playerLabel, teamId }: { stats: PlayerStat[]; playerLabel: string; teamId?: string }) {
  const [sortKey, setSortKey] = useState<SortKey>(DEFAULT_SORT)
  const [desc, setDesc] = useState(true)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setDesc(d => !d)
    else { setSortKey(key); setDesc(true) }
  }

  const sorted = sortStats(stats.filter(s => s.gamesPlayed > 0), sortKey, desc)

  function ColHeader({ label, col, title, className }: { label: string; col: SortKey; title?: string; className?: string }) {
    const active = sortKey === col
    return (
      <th className={`px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-center cursor-pointer select-none hover:opacity-80 transition-opacity${className ? ` ${className}` : ''}`}
        style={{ color: active ? 'var(--accent)' : '#89968e' }}
        onClick={() => toggleSort(col)}
        title={title}>
        {label}
        {active && <span className="ml-0.5 opacity-60">{desc ? '↓' : '↑'}</span>}
      </th>
    )
  }

  return (
    <div className="relative overflow-x-auto">
      {/* Scroll hint gradient */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-8 sm:hidden"
        style={{ background: 'linear-gradient(to right, transparent, #111713)' }} />
      <table className="w-full text-left" style={{ minWidth: 460 }}>
        <thead>
          <tr className="border-b border-[#253028]" style={{ backgroundColor: '#111713' }}>
            <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-center" style={{ color: '#89968e' }}>#</th>
            <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-left" style={{ color: '#89968e' }}>{playerLabel}</th>
            <th className="hidden sm:table-cell px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-center" style={{ color: '#89968e' }}>Pos</th>
            <ColHeader label="PJ"   col="gamesPlayed" title="Partidos jugados" />
            <ColHeader label="Min'" col="minutes"     title="Minutos totales" className="hidden sm:table-cell" />
            <ColHeader label="G"    col="goals"       title="Goles" />
            <ColHeader label="G/90" col="g90"         title="Goles por 90 min (min. 45 min jugados)" className="hidden sm:table-cell" />
            <ColHeader label="A"    col="assists"      title="Asistencias" />
            <ColHeader label="G+A"  col="ga"          title="Goles + Asistencias" />
            <ColHeader label="AM"  col="yellowCards"  title="Tarjetas amarillas" />
            <ColHeader label="RJ"  col="redCards"     title="Tarjetas rojas" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => {
            const g90raw = computeG90(s)
            const g90 = g90raw >= 0 ? g90raw.toFixed(1) : '—'
            const posShort = s.position ? s.position.slice(0, 3) : '—'
            return (
              <tr key={s.playerId} className="border-b border-[#253028] last:border-0"
                style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(15,23,42,0.4)' }}>
                <td className="px-3 py-2.5 text-center">
                  <span className="text-[11px] font-black"
                    style={{ color: i === 0 ? 'var(--accent)' : i === 1 ? '#89968e' : i === 2 ? '#9d8050' : '#334155' }}>
                    {i + 1}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  {teamId ? (
                    <Link href={`/dashboard/team/${teamId}/players/${s.playerId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <PlayerAvatar name={s.name} photoUrl={s.photoUrl} position={s.position} size="sm" className="w-7 h-7 rounded-lg flex-shrink-0" />
                      <span className="text-xs font-semibold text-white truncate hover:underline" style={{ maxWidth: 110 }}>{s.name}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2">
                      <PlayerAvatar name={s.name} photoUrl={s.photoUrl} position={s.position} size="sm" className="w-7 h-7 rounded-lg flex-shrink-0" />
                      <span className="text-xs font-semibold text-white truncate" style={{ maxWidth: 110 }}>{s.name}</span>
                    </div>
                  )}
                </td>
                <td className="hidden sm:table-cell px-3 py-2.5 text-center">
                  <span className="text-[10px] font-bold uppercase" style={{ color: '#637168' }}>{posShort}</span>
                </td>
                <td className="px-3 py-2.5 text-center text-xs font-bold" style={{ color: '#89968e' }}>{s.gamesPlayed}</td>
                <td className="hidden sm:table-cell px-3 py-2.5 text-center text-xs" style={{ color: '#637168' }}>{s.minutes}</td>
                <td className="px-3 py-2.5 text-center text-xs font-bold" style={{ color: s.goals > 0 ? 'var(--accent)' : '#334155' }}>{s.goals}</td>
                <td className="hidden sm:table-cell px-3 py-2.5 text-center text-xs font-bold"
                  style={{ color: g90raw >= 0 && s.goals > 0 ? '#a3e635' : '#334155' }}>{g90}</td>
                <td className="px-3 py-2.5 text-center text-xs font-bold" style={{ color: s.assists > 0 ? '#facc15' : '#334155' }}>{s.assists}</td>
                <td className="px-3 py-2.5 text-center text-xs font-bold"
                  style={{ color: s.goals + s.assists > 0 ? '#edf2ee' : '#334155' }}>{s.goals + s.assists}</td>
                <td className="px-3 py-2.5 text-center">
                  {s.yellowCards > 0
                    ? <span className="text-xs font-bold" style={{ color: s.yellowCards >= YELLOW_WARNING ? '#facc15' : '#89968e' }}>{s.yellowCards}</span>
                    : <span style={{ color: '#253028' }}>—</span>}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {s.redCards > 0
                    ? <span className="text-xs font-bold" style={{ color: '#f87171' }}>{s.redCards}</span>
                    : <span style={{ color: '#253028' }}>—</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
