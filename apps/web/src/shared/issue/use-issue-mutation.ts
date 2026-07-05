import type { IssueFilter } from '@raiymbek-park/shared/validation-schemas'
import type { SaveMessages } from './use-issue-save-handlers'

import { useMutation } from '@tanstack/react-query'

import { useIssueSaveHandlers } from './use-issue-save-handlers'

export const useIssueMutation = <Variables>(
  mutationFn: (variables: Variables) => Promise<number>,
  messages: SaveMessages,
  toFilter: (variables: Variables) => IssueFilter = () => 'new',
) => {
  const buildHandlers = useIssueSaveHandlers(messages)
  const mutation = useMutation({ mutationFn })
  const submit = (variables: Variables) =>
    mutation.mutate(variables, buildHandlers(toFilter(variables)))
  return { isPending: mutation.isPending, submit }
}
