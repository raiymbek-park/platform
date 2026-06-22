import { useEffect, useState } from 'react'

const remainingSeconds = (resendAvailableAt: number | null) => {
  if (resendAvailableAt === null) return 0
  return Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000))
}

const toMmss = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export const useCountdown = (resendAvailableAt: number | null) => {
  const [remaining, setRemaining] = useState(() =>
    remainingSeconds(resendAvailableAt),
  )

  useEffect(() => {
    setRemaining(remainingSeconds(resendAvailableAt))
    const id = setInterval(() => {
      const next = remainingSeconds(resendAvailableAt)
      setRemaining(next)
      if (next === 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [resendAvailableAt])

  return { remaining, mmss: toMmss(remaining) }
}
