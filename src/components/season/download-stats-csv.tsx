'use client'

type StatRow = {
  name: string
  number: number | null
  position: string | null
  gamesPlayed: number
  goals: number
  assists: number
  minutes: number
  yellowCards: number
  redCards: number
}

export function DownloadStatsCsv({ stats, seasonName }: { stats: StatRow[]; seasonName: string }) {
  function handleDownload() {
    const sorted = [...stats].sort((a, b) => b.goals - a.goals)
    const header = ['Nombre', 'Dorsal', 'Posición', 'PJ', 'Goles', 'Asistencias', 'G+A', 'Minutos', 'Min/PJ', 'Amarillas', 'Rojas']
    const rows = sorted.map(s => [
      s.name,
      s.number ?? '',
      s.position ?? '',
      s.gamesPlayed,
      s.goals,
      s.assists,
      s.goals + s.assists,
      s.minutes,
      s.gamesPlayed > 0 ? Math.round(s.minutes / s.gamesPlayed) : 0,
      s.yellowCards,
      s.redCards,
    ])
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `coachly-${seasonName.toLowerCase().replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-colors hover:bg-slate-800 cursor-pointer"
      style={{ borderColor: '#2e3447', color: '#adb4ce' }}
      title="Exportar estadísticas a Excel/CSV"
    >
      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>download</span>
      CSV
    </button>
  )
}
