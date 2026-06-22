import { useEffect, useState } from 'react'

import { formatHms } from './format-hms'

const remainingSeconds = (lockedUntil: number | null, now: number) => {
  if (lockedUntil === null) return 0
  return Math.max(0, Math.ceil((lockedUntil - now) / 1000))
}

export const useLockCountdown = (lockedUntil: number | null) => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = remainingSeconds(lockedUntil, now)
  return { remaining, hms: formatHms(remaining) }
}
