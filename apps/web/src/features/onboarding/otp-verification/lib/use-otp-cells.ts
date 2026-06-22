import { OTP_CODE_LENGTH } from '@raiymbek-park/api/contract'
import { useEffect, useRef, useState } from 'react'

const emptyCells = Array.from({ length: OTP_CODE_LENGTH }, () => '')

type UseOtpCells = {
  disabled: boolean
  onComplete: (code: string, helpers: { clear: () => void }) => void
}

export const useOtpCells = ({ disabled, onComplete }: UseOtpCells) => {
  const [cells, setCells] = useState(emptyCells)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const focusCell = (index: number) => inputRefs.current[index]?.focus()
  const reset = () => setCells(emptyCells)

  const code = cells.join('')
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const submittedRef = useRef(false)

  useEffect(() => {
    if (code.length < OTP_CODE_LENGTH) {
      submittedRef.current = false
      return
    }
    if (disabled || submittedRef.current) return
    submittedRef.current = true
    onCompleteRef.current(code, {
      clear: () => {
        setCells(emptyCells)
        inputRefs.current[0]?.focus()
      },
    })
  }, [code, disabled])

  const setDigit = (index: number, value: string) => {
    setCells(current => current.map((cell, i) => (i === index ? value : cell)))
    if (value !== '' && index < OTP_CODE_LENGTH - 1) focusCell(index + 1)
  }

  const handleKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && cells[index] === '' && index > 0) {
      focusCell(index - 1)
    }
  }

  return {
    cells,
    focusCell,
    handleKeyDown,
    inputRefs,
    reset,
    setCells,
    setDigit,
  }
}
