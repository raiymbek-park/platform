import type { RefObject } from 'react'

import { OtpInput } from '@raiymbek-park/ui'

import css from './otp-cells.module.scss'

type OtpCellsProps = {
  cells: string[]
  hasError: boolean
  inputRefs: RefObject<(HTMLInputElement | null)[]>
  isDisabled: boolean
  onDigit: (index: number, value: string) => void
  onKeyDown: (index: number, key: string) => void
}

export const OtpCells = ({
  cells,
  hasError,
  inputRefs,
  isDisabled,
  onDigit,
  onKeyDown,
}: OtpCellsProps) => (
  <fieldset className={css.cells} disabled={isDisabled}>
    <legend className='sr-only'>Код подтверждения</legend>
    {cells.map((cell, index) => (
      <OtpInput
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length cell row
        key={index}
        ref={node => {
          inputRefs.current[index] = node
        }}
        autoFocus={index === 0}
        state={hasError ? 'error' : undefined}
        value={cell}
        onChange={value => onDigit(index, value)}
        onKeyDown={event => onKeyDown(index, event.key)}
      />
    ))}
  </fieldset>
)
