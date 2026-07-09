import type { MediaItem } from './use-media-picker'

import { uploadFiles, uploadItems } from './upload-media'

export const uploadIssueMedia = (issueId: string, files: File[]) =>
  uploadFiles(`issues/${issueId}`, files)

export const uploadMediaItems = (issueId: string, items: MediaItem[]) =>
  uploadItems(`issues/${issueId}`, items)

export const uploadPostMedia = (postId: string, files: File[]) =>
  uploadFiles(`posts/${postId}`, files)

export const uploadPostMediaItems = (postId: string, items: MediaItem[]) =>
  uploadItems(`posts/${postId}`, items)
