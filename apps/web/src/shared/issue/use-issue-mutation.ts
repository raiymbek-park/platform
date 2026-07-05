import type { SaveMessages } from './use-issue-save-handlers'

import { useMutation } from '@tanstack/react-query'

import { useIssueSaveHandlers } from './use-issue-save-handlers'

export const useIssueMutation = <Variables>(
  mutationFn: (variables: Variables) => Promise<number>,
  messages: SaveMessages,
) => {
  const handlers = useIssueSaveHandlers(messages)
  const mutation = useMutation({ mutationFn })
  const submit = (variables: Variables) => mutation.mutate(variables, handlers)
  return { isPending: mutation.isPending, submit }
}
