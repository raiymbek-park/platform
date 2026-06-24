import { useMutation } from '@tanstack/react-query'

import { sendVerification } from '@/shared/auth'

export const useSendVerification = () =>
  useMutation({ mutationFn: sendVerification })
