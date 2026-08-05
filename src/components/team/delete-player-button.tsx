'use client'

import { useTransition } from 'react'
import { deletePlayer } from '@/app/dashboard/team/actions'

export function DeletePlayerButton({ playerId, teamId }: { playerId: string; teamId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirm('¿Eliminar esta jugadora de la plantilla? Esta acción no se puede deshacer.')) {
          startTransition(async () => {
            const fd = new FormData()
            fd.set('player_id', playerId)
            fd.set('team_id', teamId)
            await deletePlayer(fd)
          })
        }
      }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#f87171', backgroundColor: 'transparent' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
      {isPending ? 'Eliminando…' : 'Eliminar'}
    </button>
  )
}
