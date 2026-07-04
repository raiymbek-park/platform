import { randomId } from '@raiymbek-park/shared'
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage'
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

export const uploadIssueMedia = async (
  issueId: string,
  files: File[],
): Promise<string[]> => {
  if (!auth.currentUser?.uid) throw new Error('unauthenticated')

  const targets = await Promise.all(
    files.map(async file => {
      const upload = await compressImage(file)
      return {
        file: upload,
        ref: ref(
          storage,
          `issues/${issueId}/${randomId()}.${extensionFor(upload)}`,
        ),
      }
    }),
  )

  try {
    return await Promise.all(
      targets.map(async ({ file, ref: target }) => {
        await uploadBytesResumable(target, file)
        return getDownloadURL(target)
      }),
    )
  } catch (error) {
    await Promise.allSettled(
      targets.map(({ ref: target }) => deleteObject(target)),
    )
    throw error
  }
}
