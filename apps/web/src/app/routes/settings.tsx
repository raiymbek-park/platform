import { useLingui } from '@lingui/react/macro'
import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/pages/placeholder'
import { ensureResidentSession } from '@/shared/session'

export const Route = createFileRoute('/settings')({
  beforeLoad: ensureResidentSession,
  component: () => {
    const { t } = useLingui()
    return <PlaceholderPage active='/settings' title={t`Настройки`} />
  },
})
