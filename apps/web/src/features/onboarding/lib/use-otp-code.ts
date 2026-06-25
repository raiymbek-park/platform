import { useEffect, useRef, useState } from 'react'

import { CODE_LENGTH } from './constants'
import { toDigits } from './format-otp'

type UseOtpCode = {
  disabled: boolean
  onComplete: (code: string, helpers: { clear: () => void }) => void
}

export const useOtpCode = ({ disabled, onComplete }: UseOtpCode) => {
  const [code, setCode] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const focus = () => inputRef.current?.focus()
  const reset = () => setCode('')
  const setValue = (value: string) => setCode(toDigits(value))

  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const submittedRef = useRef(false)

  useEffect(() => {
    if (code.length < CODE_LENGTH) {
      submittedRef.current = false
      return
    }
    if (disabled || submittedRef.current) return
    submittedRef.current = true
    onCompleteRef.current(code, {
      clear: () => {
        setCode('')
        inputRef.current?.focus()
      },
    })
  }, [code, disabled])

  return { code, focus, inputRef, reset, setValue }
}
