import type { IssueCreatePayload } from '@raiymbek-park/shared/validation-schemas'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { useTRPC } from '@/shared/api'

export const useCreateIssue = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const mutation = useMutation(trpc.issues.create.mutationOptions())
  const listKey = trpc.issues.list.pathKey()

  const createIssue = async (input: IssueCreatePayload) => {
    await mutation.mutateAsync(input)
    await queryClient.invalidateQueries({
      queryKey: listKey,
      refetchType: 'all',
    })
    await navigate({ search: { status: 'new' }, to: '/issues' })
  }

  return { createIssue }
}
