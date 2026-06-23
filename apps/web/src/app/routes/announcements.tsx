import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/pages/placeholder'
import { ensureResidentSession } from '@/shared/auth'

export const Route = createFileRoute('/announcements')({
  beforeLoad: ensureResidentSession,
  component: () => (
    <PlaceholderPage active='/announcements' title='Объявления' />
  ),
})
