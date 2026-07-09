import { createFileRoute } from '@tanstack/react-router'

import { SettingsPage } from '@/pages/settings'
import { ensureResidentSession } from '@/shared/session'

export const Route = createFileRoute('/settings')({
  beforeLoad: ensureResidentSession,
  component: SettingsPage,
  loader: ({ context }) =>
    context.queryClient
      .ensureQueryData(context.trpc.resident.me.queryOptions())
      .catch(() => null),
})
