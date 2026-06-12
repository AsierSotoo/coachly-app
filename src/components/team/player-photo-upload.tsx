'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { toast } from 'sonner'
import { Camera, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface PlayerPhotoUploadProps {
  playerId: string
  currentUrl?: string | null
  playerName: string
  size?: 'sm' | 'lg'
}

export function PlayerPhotoUpload({ playerId, currentUrl, playerName, size = 'lg' }: PlayerPhotoUploadProps) {
  const [url, setUrl] = useState<string | null>(currentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const dim = size === 'sm' ? 'h-10 w-10' : 'h-20 w-20'
  const round = size === 'sm' ? 'rounded-xl' : 'rounded-2xl'
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-7 w-7'

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Solo imágenes'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Máximo 2MB'); return }

    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${playerId}/photo.${ext}`

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
      className={`relative flex ${dim} ${round} cursor-pointer items-center justify-center overflow-hidden border border-slate-700 bg-slate-800 transition-all hover:border-green-500/50 group`}
    >
      {uploading ? (
        <Loader2 className="h-5 w-5 animate-spin text-green-400" />
      ) : url ? (
        <>
          <Image src={url} alt={playerName} fill className="object-cover" unoptimized />
          <div className={`absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity ${round}`}>
            <Camera className={`${iconSize} text-white`} />
          </div>
        </>
      ) : (
        <>
          <span className="font-[family-name:var(--font-heading)] text-sm font-black text-slate-400">{initials}</span>
          <div className={`absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity ${round}`}>
            <Camera className={`${iconSize} text-white`} />
          </div>
        </>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }} />
    </div>
  )
}
