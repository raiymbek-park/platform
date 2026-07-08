import { useCallback, useEffect, useRef } from 'react'

type UseIntersectionObserverOptions = {
  enabled?: boolean
  rootMargin?: string
  threshold?: number | number[]
  onChange: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void
}

export const useIntersectionObserver = <T extends Element>({
  enabled = true,
  rootMargin = '0px',
  threshold = 0,
  onChange,
}: UseIntersectionObserverOptions) => {
  const callback = useRef(onChange)
  useEffect(() => {
    callback.current = onChange
  })

  const observer = useRef<IntersectionObserver>(undefined)

  return useCallback(
    (element: T | null) => {
      observer.current?.disconnect()
      if (!enabled || !element) return
      observer.current = new IntersectionObserver(
        ([entry]) => {
          if (entry) callback.current(entry.isIntersecting, entry)
        },
        { rootMargin, threshold },
      )
      observer.current.observe(element)
    },
    [enabled, rootMargin, threshold],
  )
}
