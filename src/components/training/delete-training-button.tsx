'use client'

import { useTransition } from 'react'
import { deleteTrainingSession } from '@/app/dashboard/season/[id]/trainings/actions'

export function DeleteTrainingButton({ id, seasonId }: { id: string; seasonId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirm('¿Eliminar esta sesión de entrenamiento? Esta acción no se puede deshacer.')) {
          startTransition(async () => {
            const fd = new FormData()
            fd.set('id', id)
            fd.set('season_id', seasonId)
            await deleteTrainingSession(fd)
          })
        }
      }}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer hover:border-red-500/40 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ borderColor: '#2a342d', color: '#637168', backgroundColor: 'transparent' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
      {isPending ? 'Eliminando…' : 'Eliminar'}
    </button>
  )
}
