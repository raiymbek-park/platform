import { createFileRoute } from '@tanstack/react-router'

import { HomePage } from '@/pages/home'
import { ensureResidentSession } from '@/shared/session'

export const Route = createFileRoute('/home')({
  beforeLoad: ensureResidentSession,
  component: HomePage,
})
