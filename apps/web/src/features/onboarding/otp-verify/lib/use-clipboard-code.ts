import { useCallback, useEffect, useState } from 'react'

const readClipboardCode = async () => {
  try {
    const text = await navigator.clipboard?.readText()
    return text && /^\d{4}$/.test(text) ? text : null
  } catch {
    return null
  }
}

export const useClipboardCode = () => {
  const [code, setCode] = useState<string | null>(null)

  const refresh = useCallback(() => {
    readClipboardCode().then(setCode)
  }, [])

  useEffect(() => {
    refresh()
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [refresh])

  return code
}
