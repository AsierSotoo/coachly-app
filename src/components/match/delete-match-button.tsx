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
        className="rounded-lg border p-1.5 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 transition-all active:scale-90 cursor-pointer" style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-4)' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
      </button>
    </form>
  )
}
