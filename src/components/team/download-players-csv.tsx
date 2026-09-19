'use client'

type PlayerRow = {
  name: string
  number: number | null
  position: string | null
  games: number
  goals: number
  assists: number
  yellowCards: number
  redCards: number
}

export function DownloadPlayersCsv({
  players,
  teamName,
}: {
  players: PlayerRow[]
  teamName: string
}) {
  function download() {
    const header = ['Dorsal', 'Nombre', 'Posición', 'PJ', 'Goles', 'Asistencias', 'Amarillas', 'Rojas']
    const rows = players
      .slice()
      .sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
      .map(p => [
        p.number ?? '',
        p.name,
        p.position ?? '',
        p.games,
        p.goals,
        p.assists,
        p.yellowCards,
        p.redCards,
      ])

    const csv = [header, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\r\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${teamName.replace(/\s+/g, '_')}_plantilla.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={download}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border transition-colors hover:bg-[#1a231d] cursor-pointer"
      style={{ backgroundColor: '#171f1a', borderColor: '#2a342d', color: '#edf2ee' }}
      title="Exportar plantilla a CSV"
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
      <span className="hidden sm:inline">CSV</span>
    </button>
  )
}
