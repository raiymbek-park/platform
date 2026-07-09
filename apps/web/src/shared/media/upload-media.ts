import type { MediaItem } from './use-media-picker'

import { randomId } from '@raiymbek-park/shared'
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'

import { auth, storage } from '@/shared/firebase'

import { compressImage } from './compress-image'

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/3gpp': '3gp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-matroska': 'mkv',
  'video/x-msvideo': 'avi',
}

const extensionFromName = (name: string): string | undefined => {
  const ext = name.includes('.') ? name.split('.').pop() : undefined
  return ext?.toLowerCase().replace(/[^a-z0-9]/g, '') || undefined
}

const extensionFor = (file: File): string =>
  MIME_EXTENSIONS[file.type] ?? extensionFromName(file.name) ?? 'bin'

const isFulfilled = <T>(
  result: PromiseSettledResult<T>,
): result is PromiseFulfilledResult<T> => result.status === 'fulfilled'

const uploadFile = async (folder: string, file: File): Promise<string> => {
  const compressed = await compressImage(file)
  const path = `${folder}/${randomId()}.${extensionFor(compressed)}`
  const target = ref(storage, path)
  await uploadBytesResumable(target, compressed)
  return getDownloadURL(target)
}

const collect = (results: PromiseSettledResult<string>[]) => {
  const urls = results.filter(isFulfilled).map(result => result.value)
  return { failedCount: results.length - urls.length, urls }
}

export const uploadFiles = (folder: string, files: File[]) => {
  if (!auth.currentUser?.uid)
    return Promise.reject(new Error('unauthenticated'))

  const uploads = files.map(file => uploadFile(folder, file))
  return Promise.allSettled(uploads).then(collect)
}

export const uploadItems = (folder: string, items: MediaItem[]) => {
  if (!auth.currentUser?.uid)
    return Promise.reject(new Error('unauthenticated'))

  const uploads = items.map(item =>
    item.file ? uploadFile(folder, item.file) : Promise.resolve(item.url),
  )
  return Promise.allSettled(uploads).then(collect)
}
