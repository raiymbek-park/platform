import { useEffect, useState } from 'react'

export const useCountdown = (target: number | null) => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (target === null) return
    const id = setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= target) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [target])

  if (target === null) return 0
  return Math.max(0, Math.ceil((target - now) / 1000))
}
