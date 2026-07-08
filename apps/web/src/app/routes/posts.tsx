import { createFileRoute, Outlet } from '@tanstack/react-router'

import { ensureResidentSession } from '@/shared/session'

export const Route = createFileRoute('/posts')({
  beforeLoad: ensureResidentSession,
  component: Outlet,
})
