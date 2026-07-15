import type { QueryClient } from '@tanstack/react-query'
import type { trpc } from '@/shared/api'

import { redirect } from '@tanstack/react-router'

import { auth } from '@/shared/firebase'

type GuardContext = {
  queryClient: QueryClient
  trpc: typeof trpc
}

export const isSignedIn = async () => {
  await auth.authStateReady()
  return auth.currentUser !== null
}

const loadProfile = (context: GuardContext) =>
  context.queryClient
    .ensureQueryData(context.trpc.resident.me.queryOptions())
    .catch(() => null)

export const isRegistered = async (context: GuardContext) => {
  if (!(await isSignedIn())) return false
  const me = await loadProfile(context)
  return me?.isRegistered ?? false
}

export const ensureRegisteredResident = async ({
  context,
}: {
  context: GuardContext
}) => {
  if (!(await isSignedIn())) throw redirect({ to: '/onboarding' })
  const me = await loadProfile(context)
  if (me === null) return
  if (!me.isRegistered) throw redirect({ to: '/onboarding' })
}
