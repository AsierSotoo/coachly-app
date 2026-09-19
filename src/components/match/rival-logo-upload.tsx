'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { compressImage } from '@/lib/compress-image'
import { toast } from 'sonner'
import { setMatchRivalLogo } from '@/app/dashboard/season/actions'

interface Props {
  matchId: string
  seasonId: string
  currentUrl?: string | null
  opponentName: string
}

export function RivalLogoUpload({ matchId, seasonId, currentUrl, opponentName }: Props) {
  const [url, setUrl] = useState<string | null>(currentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = opponentName.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Solo imágenes'); return }
    setUploading(true)
    try { file = await compressImage(file, 400, 0.9) } catch { /* usar original */ }

    const supabase = createClient()
    const path = `rivals/${matchId}/logo.jpg`

    const { error: uploadError } = await supabase.storage
      .from('team-logos').upload(path, file, { upsert: true })

    if (uploadError) { toast.error(uploadError.message); setUploading(false); return }

    const { data } = supabase.storage.from('team-logos').getPublicUrl(path)
    try {
      await setMatchRivalLogo(matchId, data.publicUrl, seasonId)
    } catch (e) {
      toast.error('Error al guardar: ' + (e instanceof Error ? e.message : String(e)))
      setUploading(false)
      return
    }

    setUrl(data.publicUrl + '?t=' + Date.now())
    toast.success('Escudo del rival actualizado')
    setUploading(false)
  }

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      title="Escudo del rival"
      className="relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-lg border transition-all group"
      style={{ borderStyle: url ? 'solid' : 'dashed', borderColor: 'var(--bdr-strong)', backgroundColor: url ? 'white' : 'var(--bg-elevated)' }}
    >
      {uploading ? (
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 14, color: 'var(--accent)' }}>progress_activity</span>
      ) : url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={opponentName} className="w-full h-full object-contain p-0.5" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
            <span className="material-symbols-outlined text-white" style={{ fontSize: 12 }}>upload</span>
          </div>
        </>
      ) : (
        <>
          <span className="text-[9px] font-black" style={{ color: 'var(--tx-3)' }}>{initials}</span>
          <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity absolute" style={{ fontSize: 14, color: 'var(--accent)' }}>add_photo_alternate</span>
        </>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }} />
    </div>
  )
}
