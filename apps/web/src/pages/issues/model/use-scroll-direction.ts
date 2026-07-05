import { useEffect, useRef, useState } from 'react'

const THRESHOLD = 8

export const useScrollDirection = () => {
  const [isScrollingDown, setScrollingDown] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY
    const handleScroll = () => {
      const y = window.scrollY
      const delta = y - lastY.current
      if (Math.abs(delta) < THRESHOLD) return
      setScrollingDown(delta > 0 && y > 0)
      lastY.current = y
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return isScrollingDown
}
