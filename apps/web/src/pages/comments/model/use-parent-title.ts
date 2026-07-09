import type { CommentTarget } from '@raiymbek-park/shared/validation-schemas'

import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const useParentTitle = ({ parent, parentId }: CommentTarget) => {
  const trpc = useTRPC()
  const post = useQuery({
    ...trpc.posts.get.queryOptions({ postId: parentId }),
    enabled: parent === 'post',
  })
  const issue = useQuery({
    ...trpc.issues.get.queryOptions({ issueId: parentId }),
    enabled: parent === 'issue',
  })

  return parent === 'post' ? post.data?.title : issue.data?.title
}
