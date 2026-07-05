import { createFileRoute, Outlet } from '@tanstack/react-router'

import { ensureResidentSession } from '@/shared/session'

export const Route = createFileRoute('/issues')({
  beforeLoad: ensureResidentSession,
  component: Outlet,
})
