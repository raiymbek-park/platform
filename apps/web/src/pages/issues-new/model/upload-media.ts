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

export const uploadIssueMedia = (issueId: string, files: File[]) => {
  if (!auth.currentUser?.uid)
    return Promise.reject(new Error('unauthenticated'))

  const uploads = files.map(async file => {
    const compressed = await compressImage(file)
    const path = `issues/${issueId}/${randomId()}.${extensionFor(compressed)}`
    const target = ref(storage, path)
    await uploadBytesResumable(target, compressed)
    return getDownloadURL(target)
  })

  return Promise.allSettled(uploads).then(results => {
    const urls = results.filter(isFulfilled).map(result => result.value)
    const failedCount = results.length - urls.length
    return { urls, failedCount }
  })
}
