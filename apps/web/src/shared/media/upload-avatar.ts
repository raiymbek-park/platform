import { deleteObject, ref } from 'firebase/storage'

import { storage } from '@/shared/firebase'

import { uploadFiles } from './upload-media'

export const uploadAvatar = (uid: string, file: File) =>
  uploadFiles(`avatars/${uid}`, [file])

export const deleteAvatar = (url: string) =>
  deleteObject(ref(storage, url)).catch(() => undefined)
