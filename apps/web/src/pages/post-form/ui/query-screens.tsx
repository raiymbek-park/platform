import { useLingui } from '@lingui/react/macro'
import { Button, ScreenHeader, Spinner } from '@raiymbek-park/ui'

import css from './query-screens.module.scss'

export const PendingScreen = () => {
  const { t } = useLingui()
  return (
    <>
      <ScreenHeader />
      <Spinner label={t`Загрузка…`} />
    </>
  )
}

export type RetryScreenProps = {
  onRetry: () => void
}

export const RetryScreen = ({ onRetry }: RetryScreenProps) => {
  const { t } = useLingui()
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
