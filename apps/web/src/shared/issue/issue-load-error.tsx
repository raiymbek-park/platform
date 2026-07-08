import { useLingui } from '@lingui/react/macro'
import { Button, ScreenHeader } from '@raiymbek-park/ui'
import { useEffect } from 'react'

import { showToastMessage } from '@/shared/toast'

import css from './issue-load-error.module.scss'

export const IssueLoadError = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useLingui()

  useEffect(() => {
    showToastMessage({ kind: 'error', text: t`Не удалось загрузить заявку` })
  }, [t])

  return (
    <>
      <ScreenHeader />
      <div className={css.state}>
        <Button icon='refresh-cw' variant='secondary' onClick={onRetry}>
          {t`Повторить`}
        </Button>
      </div>
    </>
  )
}
