'use client'

import { useState, useTransition, useRef } from 'react'
import { updateConvocatoriaDetails } from '@/app/dashboard/season/[id]/convocatorias/actions'

interface Props {
  convocatoriaId: string
  seasonId: string
  opponent: string
  playedAt: string
}

export function EditConvocatoriaName({ convocatoriaId, seasonId, opponent, playedAt }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(opponent)
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    if (!value.trim()) return
    startTransition(async () => {
      const fd = new FormData()
      fd.append('id', convocatoriaId)
      fd.append('season_id', seasonId)
      fd.append('opponent', value.trim())
      fd.append('played_at', playedAt)
      await updateConvocatoriaDetails(fd)
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSubmit()
            if (e.key === 'Escape') { setValue(opponent); setEditing(false) }
          }}
          autoFocus
          className="text-[22px] font-extrabold bg-transparent border-b-2 outline-none w-48 leading-tight"
          style={{
            fontFamily: 'Sora, sans-serif',
            color: 'var(--tx)',
            borderColor: 'var(--accent)',
          }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          className="flex items-center justify-center w-7 h-7 rounded-full transition-colors cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
        </button>
        <button
          type="button"
          onClick={() => { setValue(opponent); setEditing(false) }}
          className="flex items-center justify-center w-7 h-7 rounded-full border transition-colors cursor-pointer"
          style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 group">
      <h2 className="text-[24px] font-extrabold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--tx)' }}>
        {opponent}
      </h2>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-6 h-6 rounded-full border transition-all cursor-pointer"
        style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-3)' }}
        title="Editar nombre"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>edit</span>
      </button>
    </div>
  )
}
