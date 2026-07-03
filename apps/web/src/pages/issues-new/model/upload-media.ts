import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage'

import { auth, storage } from '@/shared/firebase'

export const uploadIssueMedia = async (files: File[]): Promise<string[]> => {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('unauthenticated')

  const batchId = crypto.randomUUID()
  const targets = files.map((file, index) => ({
    file,
    ref: ref(storage, `users/${uid}/issues/${batchId}/${index}-${file.name}`),
  }))

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
