import { OTP_CODE_LENGTH } from '@raiymbek-park/api/contract'
import { useCallback, useEffect, useState } from 'react'

// Pull the digits out of whatever is on the clipboard ("Your code: 1234" → "1234")
// and accept them only when there are exactly OTP_CODE_LENGTH of them.
const readClipboardCode = async () => {
  try {
    const text = await navigator.clipboard?.readText()
    const digits = (text ?? '').replace(/\D/g, '')
    return digits.length === OTP_CODE_LENGTH ? digits : null
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
