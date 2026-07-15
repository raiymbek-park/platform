import { createFileRoute } from '@tanstack/react-router'

import { HomePage } from '@/pages/home'
import { ensureRegisteredResident } from '@/shared/session'

export const Route = createFileRoute('/home')({
  beforeLoad: ensureRegisteredResident,
  component: HomePage,
})
