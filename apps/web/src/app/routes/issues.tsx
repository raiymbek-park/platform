import { createFileRoute, Outlet } from '@tanstack/react-router'

import { ensureRegisteredResident } from '@/shared/session'

export const Route = createFileRoute('/issues')({
  beforeLoad: ensureRegisteredResident,
  component: Outlet,
})
