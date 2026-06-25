import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useTRPC } from '@/shared/api'

const VISIT_MARKED_KEY = 'raiymbek:visit-marked'

// Records the visit once per browser session, and only after the changes feed has
// loaded — so the feed is read against the previous lastVisit before this visit
// overwrites it. The synchronous sessionStorage guard also skips SPA re-navigation
// and React StrictMode's double-invoked effect.
export const useMarkVisit = (ready: boolean) => {
  const trpc = useTRPC()
  const { mutate } = useMutation(trpc.resident.markVisit.mutationOptions())

  useEffect(() => {
    if (!ready || sessionStorage.getItem(VISIT_MARKED_KEY)) return
    sessionStorage.setItem(VISIT_MARKED_KEY, '1')
    mutate()
  }, [ready, mutate])
}
