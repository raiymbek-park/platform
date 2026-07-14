import type { Event } from '../events/events-store'
import type { Locale } from '../i18n'
import type { PushToken } from './push-token-store'

import { getEvents } from '../events/events-store'
import { Timestamp } from '../firestore'
import { digestTitle } from '../i18n'
import { getNotificationTarget, markNotified } from '../resident/resident-store'
import { digestBody } from './digest-copy'
import { getMessagingClient } from './messaging'
import {
  getResidentTokens,
  residentIdsWithTokens,
  unregisterPushToken,
} from './push-token-store'
import { isQuietHour } from './quiet-hours'

const HOME_LINK = 'https://raiymbek-park.github.io/platform/home'
const STALE_TOKEN_CODE = 'messaging/registration-token-not-registered'

const laterOf = (
  a: Timestamp | null,
  b: Timestamp | null,
): Timestamp | null => {
  if (!a) return b
  if (!b) return a
  return a.toMillis() >= b.toMillis() ? a : b
}

const byLocale = (tokens: PushToken[]): Map<Locale, string[]> =>
  tokens.reduce(
    (groups, { locale, token }) =>
      groups.set(locale, [...(groups.get(locale) ?? []), token]),
    new Map<Locale, string[]>(),
  )

const sendLocaleGroup = async (
  uid: string,
  locale: Locale,
  tokens: string[],
  events: Event[],
): Promise<boolean> => {
  const response = await getMessagingClient().sendEachForMulticast({
    notification: {
      body: digestBody(locale, events),
      title: digestTitle[locale],
    },
    tokens,
    webpush: {
      fcmOptions: { link: HOME_LINK },
      headers: { Topic: uid },
      notification: { tag: uid },
    },
  })
  const staleTokens = tokens.filter(
    (_, index) => response.responses[index]?.error?.code === STALE_TOKEN_CODE,
  )
  await Promise.all(staleTokens.map(token => unregisterPushToken(uid, token)))
  return response.successCount > 0
}

const sendResidentDigest = async (
  uid: string,
  windowEnd: Timestamp,
): Promise<void> => {
  const target = await getNotificationTarget(uid)
  if (!target) return
  const since = laterOf(target.lastVisit, target.lastNotifiedAt)
  const events = await getEvents(uid, target.role, since)
  if (events.length === 0) return
  const tokens = await getResidentTokens(uid)
  if (tokens.length === 0) return
  const outcomes = await Promise.all(
    [...byLocale(tokens)].map(([locale, group]) =>
      sendLocaleGroup(uid, locale, group, events),
    ),
  )
  if (outcomes.some(Boolean)) await markNotified(uid, windowEnd)
}

export const sendDigests = async (now = new Date()): Promise<void> => {
  if (isQuietHour(now)) return
  const windowEnd = Timestamp.fromDate(now)
  const uids = await residentIdsWithTokens()
  await Promise.all(
    uids.map(uid =>
      sendResidentDigest(uid, windowEnd).catch((error: unknown) => {
        console.error('digest send failed', { error, uid })
      }),
    ),
  )
}
