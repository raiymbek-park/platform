const MAX_EDGE = 1600
const QUALITY = 0.8
const COMPRESSIBLE = ['image/jpeg', 'image/png', 'image/webp']

export const compressImage = async (file: File): Promise<File> => {
  if (!COMPRESSIBLE.includes(file.type)) return file

  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image',
    })
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return file

    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/webp', QUALITY),
    )
    if (!blob || blob.size >= file.size) return file

    const name = `${file.name.replace(/\.[^.]+$/, '')}.webp`
    return new File([blob], name, { type: 'image/webp' })
  } catch {
    return file
  }
}
