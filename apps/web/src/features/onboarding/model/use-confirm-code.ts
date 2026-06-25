import { useMutation } from '@tanstack/react-query'

import { useConfirmationStore } from './use-confirmation-store'

const confirmCode = (code: string) => {
  const { confirmation } = useConfirmationStore.getState()
  if (confirmation === null) throw new Error('No verification in progress')
  return confirmation.confirm(code)
}

export const useConfirmCode = () => useMutation({ mutationFn: confirmCode })
