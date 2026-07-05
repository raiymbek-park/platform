import { useLingui } from '@lingui/react/macro'
import { Button, InfoCallout, ScreenHeader } from '@raiymbek-park/ui'

import css from './issue-load-error.module.scss'

export const IssueLoadError = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useLingui()

  return (
    <>
      <ScreenHeader />
      <div className={css.state}>
        <InfoCallout icon='circle-alert' variant='danger'>
          {t`Не удалось загрузить заявку`}
        </InfoCallout>
        <Button icon='refresh-cw' variant='secondary' onClick={onRetry}>
          {t`Повторить`}
        </Button>
      </div>
    </>
  )
}
