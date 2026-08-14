'use client'

import { useTransition } from 'react'
import { deleteTeam } from '@/app/dashboard/team/actions'

export function DeleteTeamButton({ teamId, teamName }: { teamId: string; teamName: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirm(`¿Eliminar "${teamName}" y todos sus datos?\n\nEsto borrará permanentemente la plantilla, todas las temporadas, partidos y estadísticas. Esta acción no se puede deshacer.`)) {
          startTransition(async () => {
            const fd = new FormData()
            fd.set('team_id', teamId)
            await deleteTeam(fd)
          })
        }
      }}
      className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ minHeight: 44, borderColor: 'rgba(239,68,68,0.4)', color: '#f87171', backgroundColor: 'rgba(239,68,68,0.05)' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_forever</span>
      {isPending ? 'Eliminando…' : 'Eliminar equipo permanentemente'}
    </button>
  )
}
