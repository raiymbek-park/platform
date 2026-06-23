import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/pages/placeholder'
import { ensureResidentSession } from '@/shared/auth'

export const Route = createFileRoute('/requests')({
  beforeLoad: ensureResidentSession,
  component: () => <PlaceholderPage active='/requests' title='Заявки' />,
})
