import { useCallback, useEffect, useRef, useState } from 'react'

// Escalating cooldown (seconds) per attempt: each resend waits longer, so a bot
// spamming the resend button can't drain the SMS budget. Index 0 is the initial
// wait (a code was already sent on the previous screen); later resends climb and
// cap at the last step. This only deters UI abuse — the real budget guard is the
// server-side per-phone rate limit in otp.send (60s interval + hourly window),
// which throttles failed and successful sends alike.
const COOLDOWN_LADDER = [60, 120, 300, 600] as const

const cooldownFor = (attempt: number): number => {
  const step = Math.min(attempt, COOLDOWN_LADDER.length - 1)
  return COOLDOWN_LADDER[step] ?? COOLDOWN_LADDER[0]
}

export const useResendCooldown = () => {
  const attempt = useRef(0)
  const [secondsLeft, setSecondsLeft] = useState(cooldownFor(0))

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(value => (value <= 0 ? value : value - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const restart = useCallback((advance = true) => {
    if (advance) attempt.current += 1
    setSecondsLeft(cooldownFor(attempt.current))
  }, [])

  return { restart, secondsLeft }
}
