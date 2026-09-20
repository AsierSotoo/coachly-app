'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { compressImage } from '@/lib/compress-image'
import { toast } from 'sonner'
import Image from 'next/image'

interface PlayerPhotoUploadProps {
  playerId: string
  currentUrl?: string | null
  playerName: string
  size?: 'sm' | 'lg'
  circular?: boolean
  className?: string
  style?: React.CSSProperties
}

export function PlayerPhotoUpload({ playerId, currentUrl, playerName, size = 'lg', circular, className, style }: PlayerPhotoUploadProps) {
  const [url, setUrl] = useState<string | null>(currentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const dim = circular ? 'h-24 w-24' : size === 'sm' ? 'h-10 w-10' : 'h-20 w-20'
  const round = circular ? 'rounded-full' : size === 'sm' ? 'rounded-xl' : 'rounded-2xl'

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Solo imágenes'); return }

    setUploading(true)
    try {
      file = await compressImage(file, 900, 0.82)
    } catch { /* si falla la compresión, intentamos con el original */ }

    const supabase = createClient()
    const path = `${playerId}/photo.jpg`

    const { error: uploadError } = await supabase.storage
      .from('player-photos').upload(path, file, { upsert: true })

    if (uploadError) { toast.error(uploadError.message); setUploading(false); return }

    const { data } = supabase.storage.from('player-photos').getPublicUrl(path)
    const publicUrl = data.publicUrl + '?t=' + Date.now()

    await supabase.from('players').update({ photo_url: data.publicUrl }).eq('id', playerId)

    setUrl(publicUrl)
    toast.success('Foto actualizada')
    setUploading(false)
  }

  const initials = playerName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      className={className ?? `relative flex ${dim} ${round} cursor-pointer items-center justify-center overflow-hidden border transition-all hover:border-green-500/50 group`}
      style={style ?? { borderColor: 'var(--bdr-strong)', backgroundColor: 'var(--bg-elevated)' }}
    >
      {uploading ? (
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 20, color: 'var(--accent)' }}>progress_activity</span>
      ) : url ? (
        <>
          <Image src={url} alt={playerName} fill className="object-cover" unoptimized />
          <div className={`absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity ${round}`}>
            <span className="material-symbols-outlined text-white" style={{ fontSize: size === 'sm' ? 14 : 24 }}>photo_camera</span>
          </div>
        </>
      ) : (
        <>
          <span className="font-[family-name:var(--font-heading)] text-sm font-black" style={{ color: 'var(--tx-3)' }}>{initials}</span>
          <div className={`absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity ${round}`}>
            <span className="material-symbols-outlined text-white" style={{ fontSize: size === 'sm' ? 14 : 24 }}>photo_camera</span>
          </div>
        </>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }} />
    </div>
  )
}
