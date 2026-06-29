'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { compressImage } from '@/lib/compress-image'
import { toast } from 'sonner'
import Image from 'next/image'

interface Props {
  matchId: string
  currentUrl?: string | null
  opponentName: string
}

export function RivalLogoUpload({ matchId, currentUrl, opponentName }: Props) {
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
    await supabase.from('matches').update({ rival_logo_url: data.publicUrl }).eq('id', matchId)

    setUrl(data.publicUrl + '?t=' + Date.now())
    toast.success('Escudo del rival actualizado')
    setUploading(false)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className="relative flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800 hover:border-green-500/50 transition-all group"
      >
        {uploading ? (
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 20, color: '#4be277' }}>progress_activity</span>
        ) : url ? (
          <>
            <Image src={url} alt={opponentName} fill className="object-contain p-1.5" unoptimized />
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
              <span className="material-symbols-outlined text-white" style={{ fontSize: 16 }}>upload</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-black text-slate-500">{initials}</span>
            <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity absolute" style={{ fontSize: 20, color: '#4be277' }}>add_photo_alternate</span>
          </div>
        )}
      </div>
      <p className="text-[9px] text-slate-600 text-center">Escudo rival</p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }} />
    </div>
  )
}
