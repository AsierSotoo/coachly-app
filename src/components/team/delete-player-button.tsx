'use client'

import { useRef } from 'react'
import { deletePlayer } from '@/app/dashboard/team/actions'

export function DeletePlayerButton({ playerId, teamId }: { playerId: string; teamId: string }) {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form ref={formRef} action={deletePlayer}>
      <input type="hidden" name="player_id" value={playerId} />
      <input type="hidden" name="team_id" value={teamId} />
      <button
        type="button"
        onClick={() => {
          if (confirm('¿Eliminar esta jugadora de la plantilla? Esta acción no se puede deshacer.')) {
            formRef.current?.requestSubmit()
          }
        }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer border"
        style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#f87171', backgroundColor: 'transparent' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
        Eliminar
      </button>
    </form>
  )
}
