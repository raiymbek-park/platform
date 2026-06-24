import { useCallback, useEffect, useState } from 'react'

import { CODE_LENGTH } from './code-length'

const codePattern = new RegExp(`(?<!\\d)\\d{${CODE_LENGTH}}(?!\\d)`)

const readClipboardCode = async () => {
  try {
    const text = await navigator.clipboard?.readText()
    return text?.match(codePattern)?.[0] ?? null
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
