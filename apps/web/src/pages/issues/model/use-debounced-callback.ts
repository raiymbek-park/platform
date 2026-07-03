import { useCallback, useEffect, useRef } from 'react'

type UseDebouncedCallbackOptions<Args extends unknown[]> = {
  callback: (...args: Args) => void
  delay: number
}

export const useDebouncedCallback = <Args extends unknown[]>({
  callback,
  delay,
}: UseDebouncedCallbackOptions<Args>) => {
  const latest = useRef(callback)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    latest.current = callback
  })

  useEffect(() => () => clearTimeout(timer.current), [])

  return useCallback(
    (...args: Args) => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => latest.current(...args), delay)
    },
    [delay],
  )
}
