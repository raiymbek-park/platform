import { getStorage } from 'firebase-admin/storage'

export const resolveBucketName = async (): Promise<string> => {
  const project = process.env.GOOGLE_CLOUD_PROJECT ?? 'raiymbek-park-sa99'
  const candidates = [
    `${project}.firebasestorage.app`,
    `${project}.appspot.com`,
  ]
  const found = await Promise.all(
    candidates.map(async name => {
      const [exists] = await getStorage().bucket(name).exists()
      return exists ? name : null
    }),
  )
  const name = found.find(Boolean)
  if (!name) throw new Error(`No storage bucket for project ${project}`)
  return name
}

const deleteByPrefix = async (prefix: string): Promise<void> => {
  const name = await resolveBucketName()
  await getStorage().bucket(name).deleteFiles({ prefix })
}

export const deleteIssueMedia = (issueId: string): Promise<void> =>
  deleteByPrefix(`issues/${issueId}/`)

export const deletePostMedia = (postId: string): Promise<void> =>
  deleteByPrefix(`posts/${postId}/`)

export const deleteCommentMedia = (
  parent: string,
  parentId: string,
  commentId: string,
): Promise<void> =>
  deleteByPrefix(`${parent}s/${parentId}/comments/${commentId}/`)
