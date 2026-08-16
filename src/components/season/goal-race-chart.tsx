'use client'

import { useState } from 'react'

export type GoalRaceLine = {
  name: string
  color: string
  cumGoals: number[]
}

export function GoalRaceChart({ players, matchLabels }: { players: GoalRaceLine[]; matchLabels: string[] }) {
  const [hovered, setHovered] = useState<{ mi: number; pi: number } | null>(null)

  if (players.length === 0 || matchLabels.length < 2) return null

  const maxGoals = Math.max(...players.flatMap(p => p.cumGoals), 1)
  const W = 560, H = 200
  const pL = 28, pR = 8, pT = 12, pB = 24
  const cW = W - pL - pR
  const cH = H - pT - pB
  const n = matchLabels.length

  const x = (i: number) => pL + (n <= 1 ? 0 : (i / (n - 1)) * cW)
  const y = (g: number) => pT + (1 - g / maxGoals) * cH

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f}
          x1={pL} y1={pT + (1 - f) * cH}
          x2={W - pR} y2={pT + (1 - f) * cH}
          stroke="#1e293b" strokeWidth="1" />
      ))}
      {/* Y labels */}
      {[0.25, 0.5, 0.75, 1].map(f => {
        const val = Math.round(f * maxGoals)
        if (val === 0) return null
        return (
          <text key={f} x={pL - 5} y={pT + (1 - f) * cH + 4}
            textAnchor="end" fill="#334155" fontSize="9">{val}</text>
        )
      })}

      {/* Lines per player */}
      {players.map((p, pi) => {
        const pts = p.cumGoals.map((g, i) => `${x(i)},${y(g)}`).join(' ')
        return (
          <g key={pi}>
            <polyline points={pts} fill="none" stroke={p.color}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
            {p.cumGoals.map((g, mi) => (
              <circle key={mi} cx={x(mi)} cy={y(g)}
                r={hovered?.pi === pi && hovered?.mi === mi ? 5 : 3}
                fill={p.color}
                opacity={hovered?.pi === pi && hovered?.mi === mi ? 1 : 0.7}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered({ mi, pi })}
                onMouseLeave={() => setHovered(null)} />
            ))}
          </g>
        )
      })}

      {/* Tooltip on hover */}
      {hovered && (() => {
        const p = players[hovered.pi]
        const g = p.cumGoals[hovered.mi]
        const cx = x(hovered.mi)
        const cy = y(g)
        const flip = cx > W * 0.65
        const tx = flip ? cx - 106 : cx + 8
        return (
          <g pointerEvents="none">
            <rect x={tx} y={cy - 22} width={98} height={38} rx="6"
              fill="#151b2d" stroke={p.color} strokeWidth="1" opacity="0.97" />
            <text x={tx + 49} y={cy - 7} textAnchor="middle" fill={p.color} fontSize="10" fontWeight="700">
              {p.name.split(' ')[0]}
            </text>
            <text x={tx + 49} y={cy + 10} textAnchor="middle" fill="#dce1fb" fontSize="11" fontWeight="700">
              {g} gol{g !== 1 ? 'es' : ''}
            </text>
          </g>
        )
      })()}

      {/* X axis labels */}
      {matchLabels.map((lbl, i) => {
        const step = Math.max(1, Math.ceil(n / 7))
        const show = i === 0 || i === n - 1 || i % step === 0
        if (!show) return null
        return (
          <text key={i} x={x(i)} y={H - 4} textAnchor="middle" fill="#475569" fontSize="9">
            {lbl.slice(0, 5)}
          </text>
        )
      })}
    </svg>
  )
}
