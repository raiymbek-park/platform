import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const useContactsData = () => {
  const trpc = useTRPC()
  return useQuery(trpc.home.contacts.queryOptions())
}
