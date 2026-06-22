import { useCountdown as useSecondsRemaining } from '@/shared/lib'

const toMmss = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export const useCountdown = (resendAvailableAt: number | null) => {
  const remaining = useSecondsRemaining(resendAvailableAt)
  return { remaining, mmss: toMmss(remaining) }
}
