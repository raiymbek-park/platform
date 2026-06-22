import { useEffect, useState } from 'react'

// Seconds remaining until `target` (epoch ms), recomputed from a single ticking
// `now` so a freshly-changed target is reflected on the same render — never a
// stale value. Returns 0 when target is null or already past.
export const useCountdown = (target: number | null) => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (target === null) return 0
  return Math.max(0, Math.ceil((target - now) / 1000))
}
