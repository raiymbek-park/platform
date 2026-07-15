import { createFileRoute, Outlet } from '@tanstack/react-router'

import { ensureRegisteredResident } from '@/shared/session'

export const Route = createFileRoute('/posts')({
  beforeLoad: ensureRegisteredResident,
  component: Outlet,
})
