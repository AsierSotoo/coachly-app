'use client'

import { deleteConvocatoria } from '@/app/dashboard/season/[id]/convocatorias/actions'

export function DeleteConvocatoriaButton({ id, seasonId }: { id: string; seasonId: string }) {
  return (
    <form
      action={deleteConvocatoria}
      onSubmit={e => {
        if (!confirm('¿Eliminar esta convocatoria?')) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="season_id" value={seasonId} />
      <button
        type="submit"
        className="rounded-xl border p-1.5 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 transition-all active:scale-90 cursor-pointer" style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-4)' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
      </button>
    </form>
  )
}
