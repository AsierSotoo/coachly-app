'use client'

import { deleteTrainingSession } from '@/app/dashboard/season/[id]/trainings/actions'

export function DeleteTrainingButton({ id, seasonId }: { id: string; seasonId: string }) {
  return (
    <form action={deleteTrainingSession}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="season_id" value={seasonId} />
      <button
        type="submit"
        onClick={e => { if (!confirm('¿Eliminar esta sesión?')) e.preventDefault() }}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer hover:border-red-500/40 hover:text-red-400"
        style={{ borderColor: '#2e3447', color: '#64748b', backgroundColor: 'transparent' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
        Eliminar
      </button>
    </form>
  )
}
