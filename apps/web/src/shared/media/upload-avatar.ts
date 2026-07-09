import { uploadFiles } from './upload-media'

export const uploadAvatar = (uid: string, file: File) =>
  uploadFiles(`avatars/${uid}`, [file])
