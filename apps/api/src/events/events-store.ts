import type {
  IssueStatus,
  PermissionRole,
  PostCategory,
  PostKind,
} from '@raiymbek-park/shared/validation-schemas'

import { getDb, type Timestamp } from '../firestore'
import { toStatus } from '../issues/issues-store'
import { getWatchedIssueIds } from '../issues/watch-store'
import { toCategory } from '../posts/posts-store'
import { toMillis, toNumber, toText } from '../store-helpers'

export type Event =
  | {
      type: 'announcement'
      id: string
      createdAt: number
      category: PostCategory
      title: string
    }
  | {
      type: 'offer'
      id: string
      createdAt: number
      category: PostCategory
      title: string
    }
  | {
      type: 'issue-status'
      issueId: string
      number: number
      createdAt: number
      status: IssueStatus
    }
  | {
      type: 'issue-comment'
      issueId: string
      number: number
      createdAt: number
    }

const EVENT_LIMIT = 10

const postEvents = async (
  kind: PostKind,
  uid: string | null,
  since: Timestamp | null,
): Promise<Event[]> => {
  const scoped = getDb().collection('posts').where('kind', '==', kind)
  const fresh = since ? scoped.where('createdAt', '>', since) : scoped
  const snap = await fresh.orderBy('createdAt', 'desc').limit(EVENT_LIMIT).get()
  return snap.docs
    .filter(doc => toText(doc.data().authorId) !== uid)
    .map(doc => {
      const data = doc.data()
      return {
        category: toCategory(data.category),
        createdAt: toMillis(data.createdAt),
        id: doc.id,
        title: toText(data.title),
        type: kind,
      }
    })
}

const issueEvents = async (
  uid: string,
  since: Timestamp | null,
): Promise<Event[]> => {
  const issueIds = await getWatchedIssueIds(uid)
  if (issueIds.length === 0) return []
  const db = getDb()
  const snaps = await db.getAll(
    ...issueIds.map(id => db.collection('issues').doc(id)),
  )
  const sinceMillis = since ? since.toMillis() : 0
  return snaps.flatMap(snap => {
    const data = snap.data()
    if (!data) return []
    const number = toNumber(data.number)
    const lastStatusAt = toMillis(data.lastStatusAt)
    const lastCommentAt = toMillis(data.lastCommentAt)
    const lastCommentBy = toText(data.lastCommentBy)
    const statusEvents: Event[] =
      lastStatusAt > sinceMillis
        ? [
            {
              createdAt: lastStatusAt,
              issueId: snap.id,
              number,
              status: toStatus(data.status),
              type: 'issue-status',
            },
          ]
        : []
    const commentEvents: Event[] =
      lastCommentAt > sinceMillis && lastCommentBy !== uid
        ? [
            {
              createdAt: lastCommentAt,
              issueId: snap.id,
              number,
              type: 'issue-comment',
            },
          ]
        : []
    return [...statusEvents, ...commentEvents]
  })
}

// Managers and administration are subscribed to every issue by default, so their
// feed draws status changes and new comments across all issues, not only followed
// ones — excluding activity they caused themselves.
const staffIssueEvents = async (
  uid: string,
  since: Timestamp | null,
): Promise<Event[]> => {
  const issues = getDb().collection('issues')
  const statusQuery = (
    since ? issues.where('lastStatusAt', '>', since) : issues
  )
    .orderBy('lastStatusAt', 'desc')
    .limit(EVENT_LIMIT)
  const commentQuery = (
    since ? issues.where('lastCommentAt', '>', since) : issues
  )
    .orderBy('lastCommentAt', 'desc')
    .limit(EVENT_LIMIT)
  const [statusSnap, commentSnap] = await Promise.all([
    statusQuery.get(),
    commentQuery.get(),
  ])
  const statusEvents: Event[] = statusSnap.docs
    .filter(doc => toText(doc.data().lastStatusBy) !== uid)
    .map(doc => {
      const data = doc.data()
      return {
        createdAt: toMillis(data.lastStatusAt),
        issueId: doc.id,
        number: toNumber(data.number),
        status: toStatus(data.status),
        type: 'issue-status',
      }
    })
  const commentEvents: Event[] = commentSnap.docs
    .filter(doc => toText(doc.data().lastCommentBy) !== uid)
    .map(doc => {
      const data = doc.data()
      return {
        createdAt: toMillis(data.lastCommentAt),
        issueId: doc.id,
        number: toNumber(data.number),
        type: 'issue-comment',
      }
    })
  return [...statusEvents, ...commentEvents]
}

const issueActivity = (
  uid: string | null,
  role: PermissionRole | null,
  since: Timestamp | null,
): Promise<Event[]> | Event[] => {
  if (!uid) return []
  const isStaff = role === 'manager' || role === 'administration'
  return isStaff ? staffIssueEvents(uid, since) : issueEvents(uid, since)
}

export const getEvents = async (
  uid: string | null,
  role: PermissionRole | null,
  since: Timestamp | null,
): Promise<Event[]> => {
  const [announcements, offers, activity] = await Promise.all([
    postEvents('announcement', uid, since),
    postEvents('offer', uid, since),
    issueActivity(uid, role, since),
  ])
  return [...announcements, ...offers, ...activity]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, EVENT_LIMIT)
}
