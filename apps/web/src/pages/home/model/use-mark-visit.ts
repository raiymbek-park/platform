import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useTRPC } from '@/shared/api'

// Module-scoped so the visit is recorded once per page load: the flag survives
// SPA section navigation (module stays loaded) yet resets on a full reload (the
// module re-executes), which is exactly when the feed should be re-read against
// the freshly advanced lastVisit. Set only after the feed has loaded, so the
// feed is read against the previous lastVisit before this visit overwrites it.
let visitMarked = false

export const useMarkVisit = (ready: boolean) => {
  const trpc = useTRPC()
  const { mutate } = useMutation(trpc.resident.markVisit.mutationOptions())

  useEffect(() => {
    if (!ready || visitMarked) return
    visitMarked = true
    mutate()
  }, [ready, mutate])
}
