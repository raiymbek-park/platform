import type { CommentParent } from '@raiymbek-park/shared/validation-schemas'

import { uploadFiles } from './upload-media'

const commentFolder = (
  parent: CommentParent,
  parentId: string,
  commentId: string,
): string => `${parent}s/${parentId}/comments/${commentId}`

export const uploadCommentMedia = (
  parent: CommentParent,
  parentId: string,
  commentId: string,
  files: File[],
) => uploadFiles(commentFolder(parent, parentId, commentId), files)
