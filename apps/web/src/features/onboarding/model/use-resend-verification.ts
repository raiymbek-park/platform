import { useMutation } from '@tanstack/react-query'

import { sendVerification } from './send-verification'

export const useResendVerification = () =>
  useMutation({ mutationFn: sendVerification })
