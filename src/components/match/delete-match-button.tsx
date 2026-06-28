'use client'

import { deleteMatch } from '@/app/dashboard/season/actions'

export function DeleteMatchButton({ matchId, seasonId }: { matchId: string; seasonId: string }) {
  return (
    <form
      action={deleteMatch}
      onSubmit={e => {
        if (!confirm('¿Eliminar este partido? Se borrarán también todas las apariciones registradas.')) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="match_id" value={matchId} />
      <input type="hidden" name="season_id" value={seasonId} />
      <button
        type="submit"
        className="rounded-lg border border-slate-700 p-1.5 text-slate-600 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
      </button>
    </form>
  )
}
