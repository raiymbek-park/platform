import { createFileRoute } from '@tanstack/react-router'

import { SettingsPage } from '@/pages/settings'
import { ensureRegisteredResident } from '@/shared/session'

export const Route = createFileRoute('/settings')({
  beforeLoad: ensureRegisteredResident,
  component: SettingsPage,
  loader: ({ context }) =>
    context.queryClient
      .ensureQueryData(context.trpc.resident.me.queryOptions())
      .catch(() => null),
})
