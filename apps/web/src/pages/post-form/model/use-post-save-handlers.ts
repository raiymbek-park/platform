import type { PostTab } from '@raiymbek-park/shared/validation-schemas'
import type { SaveMessages } from '@/shared/form'

import { useNavigate } from '@tanstack/react-router'

import { useTRPC } from '@/shared/api'
import { useSaveHandlers } from '@/shared/form'

export type { SaveMessages }

export const usePostSaveHandlers = (messages: SaveMessages) => {
  const trpc = useTRPC()
  const navigate = useNavigate()
  const buildHandlers = useSaveHandlers({
    detailKey: trpc.posts.get.pathKey(),
    listKey: trpc.posts.list.pathKey(),
    messages,
  })

  return (tab: PostTab) =>
    buildHandlers(() => navigate({ search: { tab }, to: '/posts' }))
}
