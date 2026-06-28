'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { toast } from 'sonner'
import Image from 'next/image'

interface AvatarUploadProps {
  userId: string
  currentUrl?: string | null
  name: string
  size?: number
}

export function AvatarUpload({ userId, currentUrl, name, size = 96 }: AvatarUploadProps) {
  const [url, setUrl] = useState<string | null>(currentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Solo imágenes'); return }
    if (file.size > 3 * 1024 * 1024) { toast.error('Máximo 3MB'); return }

    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('user-avatars').upload(path, file, { upsert: true })

    if (uploadError) { toast.error(uploadError.message); setUploading(false); return }

    const { data } = supabase.storage.from('user-avatars').getPublicUrl(path)
    const bust = data.publicUrl + '?t=' + Date.now()

    const { error: dbError } = await supabase.from('users').update({ avatar_url: data.publicUrl }).eq('id', userId)
    if (dbError) { toast.error(dbError.message); setUploading(false); return }

    setUrl(bust)
    toast.success('Foto de perfil actualizada')
    setUploading(false)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => !uploading && inputRef.current?.click()}
        className="group relative overflow-hidden rounded-full cursor-pointer"
        style={{ width: size, height: size }}
      >
        {/* Avatar */}
        {url ? (
          <Image src={url} alt={name} fill className="object-cover" unoptimized />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-500 to-green-700"
            style={{ width: size, height: size }}
          >
            <span
              className="font-[family-name:var(--font-heading)] font-black text-white"
              style={{ fontSize: size * 0.35 }}
            >
              {initials}
            </span>
          </div>
        )}

        {/* Overlay al hover */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading
            ? <span className="material-symbols-outlined animate-spin text-white" style={{ fontSize: 22 }}>progress_activity</span>
            : <>
                <span className="material-symbols-outlined text-white" style={{ fontSize: 20 }}>photo_camera</span>
                <span className="text-[9px] font-bold text-white uppercase tracking-wide">Cambiar</span>
              </>
          }
        </div>

        {/* Borde verde al hover */}
        <div className="absolute inset-0 rounded-full ring-2 ring-green-500/0 group-hover:ring-green-500/60 transition-all" />
      </button>

      <p className="text-[10px] text-slate-600">Haz clic para cambiar · PNG, JPG · Máx 3MB</p>

      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }} />
    </div>
  )
}
