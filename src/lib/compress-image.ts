// Comprime una imagen en el browser usando Canvas antes de subirla a Supabase.
// Redimensiona al máximo indicado y exporta como JPEG con la calidad dada.
export async function compressImage(
  file: File,
  maxPx = 1200,
  quality = 0.82,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        if (width >= height) { height = Math.round((height * maxPx) / width); width = maxPx }
        else                 { width  = Math.round((width  * maxPx) / height); height = maxPx }
      }

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error('No se pudo comprimir la imagen')); return }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        },
        'image/jpeg',
        quality,
      )
    }

    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Error al leer la imagen')) }
    img.src = objectUrl
  })
}
