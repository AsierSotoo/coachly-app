'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { compressImage } from '@/lib/compress-image'
import { toast } from 'sonner'
import Image from 'next/image'

interface LogoUploadProps {
  teamId: string
  currentUrl?: string | null
  teamName: string
}

export function LogoUpload({ teamId, currentUrl, teamName }: LogoUploadProps) {
  const [url, setUrl] = useState<string | null>(currentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes')
      return
    }

    setUploading(true)
    try { file = await compressImage(file, 600, 0.9) } catch { /* usar original */ }

    const supabase = createClient()
    const path = `${teamId}/logo.jpg`

    const { error: uploadError } = await supabase.storage
      .from('team-logos')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      toast.error('Error al subir: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('team-logos').getPublicUrl(path)
    const publicUrl = data.publicUrl + '?t=' + Date.now()

    const { error: dbError } = await supabase
      .from('teams')
      .update({ logo_url: data.publicUrl })
      .eq('id', teamId)

    if (dbError) {
      toast.error('Error al guardar: ' + dbError.message)
    } else {
      setUrl(publicUrl)
      toast.success('Escudo actualizado')
    }
    setUploading(false)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) upload(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) upload(file)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Preview */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-3xl border-2 transition-all ${
          dragging
            ? 'border-green-400 bg-green-500/10 scale-105'
            : url
            ? 'border-slate-700 bg-white hover:border-green-500/50'
            : 'border-dashed border-slate-600 bg-slate-800/60 hover:border-green-500/50 hover:bg-slate-800'
        }`}
      >
        {uploading ? (
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: '#72e697' }}>progress_activity</span>
        ) : url ? (
          <>
            <Image src={url} alt={`Escudo ${teamName}`} fill className="object-contain p-2" unoptimized />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-3xl">
              <span className="material-symbols-outlined text-white" style={{ fontSize: 24 }}>upload</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center px-2">
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#637168' }}>shield</span>
            <span className="text-[10px] text-slate-500 leading-tight">Subir escudo</span>
          </div>
        )}
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs font-medium text-green-400 hover:text-green-300 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {url ? 'Cambiar escudo' : 'Subir escudo'}
        </button>
        <p className="mt-0.5 text-[10px] text-slate-600">PNG, JPG · Se comprime automáticamente</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  )
}
