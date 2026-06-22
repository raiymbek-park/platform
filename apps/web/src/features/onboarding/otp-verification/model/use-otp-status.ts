import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const useOtpStatus = (phone: string | null) => {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.otp.status.queryOptions({ phone: phone ?? '' }),
    enabled: phone !== null,
  })
}
