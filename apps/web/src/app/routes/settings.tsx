import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/pages/placeholder'
import { ensureResidentSession } from '@/shared/auth'

export const Route = createFileRoute('/settings')({
  beforeLoad: ensureResidentSession,
  component: () => <PlaceholderPage active='/settings' title='Настройки' />,
})
