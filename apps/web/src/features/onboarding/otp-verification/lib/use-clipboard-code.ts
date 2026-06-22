import { OTP_CODE_LENGTH } from '@raiymbek-park/api/contract'
import { useCallback, useEffect, useState } from 'react'

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
