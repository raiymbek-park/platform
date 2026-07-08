import type { PostTab } from '@raiymbek-park/shared/validation-schemas'
import type { SaveMessages } from './use-post-save-handlers'

import { useMutation } from '@tanstack/react-query'

import { usePostSaveHandlers } from './use-post-save-handlers'

export const usePostMutation = <Variables>(
  mutationFn: (variables: Variables) => Promise<number>,
  messages: SaveMessages,
  toTab: (variables: Variables) => PostTab = () => 'all',
) => {
  const buildHandlers = usePostSaveHandlers(messages)
  const mutation = useMutation({ mutationFn })
  const submit = (variables: Variables) =>
    mutation.mutate(variables, buildHandlers(toTab(variables)))
  return { isPending: mutation.isPending, submit }
}
