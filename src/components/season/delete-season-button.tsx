'use client'

import { deleteSeason } from '@/app/dashboard/team/actions'

export function DeleteSeasonButton({ seasonId, teamId, matchCount }: {
  seasonId: string
  teamId: string
  matchCount: number
}) {
  return (
    <form
      action={deleteSeason}
      onSubmit={e => {
        const msg = matchCount > 0
          ? `¿Eliminar esta temporada? Se borrarán también ${matchCount} partido${matchCount !== 1 ? 's' : ''} y todas sus estadísticas. Esta acción no se puede deshacer.`
          : '¿Eliminar esta temporada?'
        if (!confirm(msg)) e.preventDefault()
      }}
    >
      <input type="hidden" name="season_id" value={seasonId} />
      <input type="hidden" name="team_id" value={teamId} />
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer" style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-4)' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span> Eliminar
      </button>
    </form>
  )
}
