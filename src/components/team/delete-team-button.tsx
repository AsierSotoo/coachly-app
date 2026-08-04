'use client'

import { useRef } from 'react'
import { deleteTeam } from '@/app/dashboard/team/actions'

export function DeleteTeamButton({ teamId, teamName }: { teamId: string; teamName: string }) {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form ref={formRef} action={deleteTeam}>
      <input type="hidden" name="team_id" value={teamId} />
      <button
        type="button"
        onClick={() => {
          if (confirm(`¿Eliminar "${teamName}" y todos sus datos?\n\nEsto borrará permanentemente la plantilla, todas las temporadas, partidos y estadísticas. Esta acción no se puede deshacer.`)) {
            formRef.current?.requestSubmit()
          }
        }}
        className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer border"
        style={{ minHeight: 44, borderColor: 'rgba(239,68,68,0.4)', color: '#f87171', backgroundColor: 'rgba(239,68,68,0.05)' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_forever</span>
        Eliminar equipo permanentemente
      </button>
    </form>
  )
}
