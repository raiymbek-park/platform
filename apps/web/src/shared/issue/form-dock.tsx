import type { IconGlyph } from '@raiymbek-park/ui'
import type { ReactNode } from 'react'

import { useLingui } from '@lingui/react/macro'
import { Button } from '@raiymbek-park/ui'

import css from './form-dock.module.scss'

export type FormDockProps = {
  backLabel?: string
  canSubmit: boolean
  isPending: boolean
  submitIcon: IconGlyph
  submitLabel: ReactNode
  onBack: () => void
}

export const FormDock = ({
  backLabel,
  canSubmit,
  isPending,
  submitIcon,
  submitLabel,
  onBack,
}: FormDockProps) => {
  const { t } = useLingui()

  return (
    <div className={css.dock}>
      <Button
        aria-label={backLabel ?? t`Назад`}
        icon='arrow-left'
        type='button'
        variant='icon'
        onClick={onBack}
      />
      <Button
        className={css.submit}
        disabled={!canSubmit || isPending}
        icon={submitIcon}
        isLoading={isPending}
        type='submit'
      >
        {submitLabel}
      </Button>
    </div>
  )
}
