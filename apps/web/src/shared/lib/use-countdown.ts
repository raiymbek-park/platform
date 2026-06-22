import { useEffect, useState } from 'react'

export const useCountdown = (target: number | null) => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (target === null) return 0
  return Math.max(0, Math.ceil((target - now) / 1000))
}
