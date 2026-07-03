import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage'

import { auth, storage } from '@/shared/firebase'

export const uploadIssueMedia = async (
  issueId: string,
  files: File[],
): Promise<string[]> => {
  if (!auth.currentUser?.uid) throw new Error('unauthenticated')

  const targets = files.map((file, index) => ({
    file,
    ref: ref(storage, `issues/${issueId}/${index}-${file.name}`),
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
