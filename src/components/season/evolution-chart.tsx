'use client'

import { useState } from 'react'

export type ChartMatch = {
  opponent: string
  result: 'V' | 'E' | 'D'
  gf: number
  ga: number
  cumPoints: number
  date: string
}

export function EvolutionChart({ points }: { points: ChartMatch[] }) {
  const [hovered, setHovered] = useState<number | null>(null)

  if (points.length < 2) return null

  const W = 560
  const H = 160
  const PAD_X = 8
  const PAD_T = 16
  const PAD_B = 8
  const maxPts = Math.max(...points.map(p => p.cumPoints), 1)

  const cx = (i: number) => PAD_X + (i / (points.length - 1)) * (W - 2 * PAD_X)
  const cy = (pts: number) => PAD_T + (1 - pts / maxPts) * (H - PAD_T - PAD_B)

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${cx(i)},${cy(p.cumPoints)}`).join(' ')
  const areaPath = `${linePath} L${cx(points.length - 1)},${H} L${cx(0)},${H} Z`

  // Grid lines at 25%, 50%, 75%, 100%
  const gridLines = [0.25, 0.5, 0.75, 1].map(f => Math.round(maxPts * f))

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        style={{ height: 180 }}
      >
        <defs>
          <linearGradient id="evoGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#72e697" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#72e697" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid horizontales */}
        {gridLines.map(pts => (
          <g key={pts}>
            <line
              x1={PAD_X} y1={cy(pts)} x2={W - PAD_X} y2={cy(pts)}
              stroke="#253028" strokeWidth="1" strokeDasharray="4 4"
            />
            <text x={PAD_X - 4} y={cy(pts) + 4} textAnchor="end"
              fontSize="9" fill="#637168" fontFamily="Sora, sans-serif">
              {pts}
            </text>
          </g>
        ))}

        {/* Área rellena */}
        <path d={areaPath} fill="url(#evoGrad)" />

        {/* Línea */}
        <path d={linePath} fill="none" stroke="#72e697" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Puntos */}
        {points.map((p, i) => {
          const dotColor = p.result === 'V' ? '#72e697' : p.result === 'D' ? '#f87171' : '#94a3b8'
          const isHov = hovered === i
          return (
            <g key={i}>
              {/* Hit area más grande */}
              <circle
                cx={cx(i)} cy={cy(p.cumPoints)} r={16}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'crosshair' }}
              />
              <circle
                cx={cx(i)} cy={cy(p.cumPoints)}
                r={isHov ? 6 : 4}
                fill={dotColor}
                stroke="#090e0b"
                strokeWidth={2}
                style={{ transition: 'r 0.1s', pointerEvents: 'none' }}
              />
            </g>
          )
        })}

        {/* Tooltip SVG */}
        {hovered !== null && (() => {
          const p = points[hovered]
          const x = cx(hovered)
          const y = cy(p.cumPoints)
          const tipW = 110
          const tipH = 52
          const tipX = hovered < points.length / 2 ? x + 10 : x - tipW - 10
          const tipY = y - tipH / 2
          return (
            <g pointerEvents="none">
              <rect x={tipX} y={tipY} width={tipW} height={tipH} rx={6}
                fill="#111713" stroke="#2a342d" strokeWidth={1} />
              <text x={tipX + 8} y={tipY + 14} fontSize="10" fill="#89968e" fontFamily="Sora, sans-serif">
                vs {p.opponent.slice(0, 12)}{p.opponent.length > 12 ? '…' : ''}
              </text>
              <text x={tipX + 8} y={tipY + 28} fontSize="11" fontWeight="bold" fill="#edf2ee" fontFamily="Sora, sans-serif">
                {p.gf}–{p.ga} · {p.result}
              </text>
              <text x={tipX + 8} y={tipY + 43} fontSize="10" fill="#72e697" fontFamily="Sora, sans-serif">
                {p.cumPoints} pts acumulados
              </text>
            </g>
          )
        })()}
      </svg>

      {/* Eje X: nombres */}
      <div className="flex justify-between px-2 mt-1">
        {points.map((p, i) => (
          <span key={i}
            className="text-[8px] font-bold uppercase truncate text-center"
            style={{
              color: hovered === i ? '#edf2ee' : '#637168',
              width: `${100 / points.length}%`,
              transition: 'color 0.1s',
            }}>
            {p.opponent.split(' ')[0].slice(0, 5)}
          </span>
        ))}
      </div>
    </div>
  )
}
