import { useEffect, useState } from 'react'

import { formatHms } from './format-hms'

const remainingSeconds = (lockedUntil: number | null) => {
  if (lockedUntil === null) return 0
  return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000))
}

export const useLockCountdown = (lockedUntil: number | null) => {
  const [remaining, setRemaining] = useState(() =>
    remainingSeconds(lockedUntil),
  )

  useEffect(() => {
    setRemaining(remainingSeconds(lockedUntil))
    const id = setInterval(() => {
      const next = remainingSeconds(lockedUntil)
      setRemaining(next)
      if (next === 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [lockedUntil])

  return { remaining, hms: formatHms(remaining) }
}
