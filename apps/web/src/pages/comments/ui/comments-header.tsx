import type { ReactNode } from 'react'

import { useLingui } from '@lingui/react/macro'
import { Button } from '@raiymbek-park/ui'

import css from './comments-header.module.scss'

export type CommentsHeaderProps = {
  title: ReactNode
  onBack: () => void
}

export const CommentsHeader = ({ title, onBack }: CommentsHeaderProps) => {
  const { t } = useLingui()

  return (
    <header className={css.header}>
      <Button
        aria-label={t`Назад`}
        icon='arrow-left'
        variant='icon'
        onClick={onBack}
      />
      <h1 className={css.title}>{title}</h1>
    </header>
  )
}
