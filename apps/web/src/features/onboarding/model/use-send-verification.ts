import { useMutation } from '@tanstack/react-query'

import { sendVerification } from './send-verification'

export const useSendVerification = () =>
  useMutation({ mutationFn: sendVerification })
