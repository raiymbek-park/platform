import { useMutation } from '@tanstack/react-query'

import { sendVerification } from '@/shared/auth'

export const useResendVerification = () =>
  useMutation({ mutationFn: sendVerification })
