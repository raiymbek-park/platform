import type { Messaging } from 'firebase-admin/messaging'

import { getMessaging } from 'firebase-admin/messaging'

import { ensureApp } from '../firestore'

let messaging: Messaging | null = null

export const getMessagingClient = (): Messaging => {
  if (messaging) return messaging
  ensureApp()
  messaging = getMessaging()
  return messaging
}
