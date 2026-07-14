import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  assertFails,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const EMULATOR = process.env.FIRESTORE_EMULATOR_HOST

const rulesPath = resolve(__dirname, '../../../firestore.rules')

const parseEmulatorHost = (host: string): { host: string; port: number } => {
  const parts = host.split(':')
  return { host: parts[0] ?? 'localhost', port: Number(parts[1] ?? 8080) }
}

const clearCollection = async (
  db: FirebaseFirestore.Firestore,
  col: string,
) => {
  const snap = await db.collection(col).get()
  const batch = db.batch()
  snap.docs.forEach(d => {
    batch.delete(d.ref)
  })
  await batch.commit()
}

describe.skipIf(!EMULATOR)('infra-2 integration — Firestore emulator', () => {
  let getDb: () => FirebaseFirestore.Firestore

  beforeAll(async () => {
    const mod = await import('./firestore')
    getDb = mod.getDb
  })

  const clearAll = async () => {
    const db = getDb()
    await Promise.all([
      clearCollection(db, 'residents'),
      clearCollection(db, 'service-contacts'),
      clearCollection(db, 'posts'),
    ])
  }

  beforeEach(clearAll)
  afterAll(clearAll)

  describe('resident-store — register writes residents/{uid}', () => {
    it('stored profile is readable back under the same uid', async () => {
      const { createResidentIfAbsent, getResident } = await import(
        './resident/resident-store'
      )

      const input = {
        apartment: 42,
        avatarUrl: null,
        block: 1,
        cars: [],
        isPhoneVisible: false,
        name: 'Иван Петров',
        phone: '+77071234567',
        role: 'owner',
      }
      const uid = 'firebase-uid-happy-2'
      await createResidentIfAbsent(uid, input)

      const resident = await getResident(uid)
      expect(resident).toEqual(input)
    })
  })

  describe('resident-store — profile read', () => {
    it('returned profile equals the stored name, block, apartment, role, and phone', async () => {
      const { createResidentIfAbsent, getResident } = await import(
        './resident/resident-store'
      )

      const input = {
        apartment: 10,
        avatarUrl: null,
        block: 2,
        cars: [],
        isPhoneVisible: false,
        name: 'Айгерим Сатыбалды',
        phone: '+77011112233',
        role: 'tenant',
      }
      const uid = 'firebase-uid-happy-3'
      await createResidentIfAbsent(uid, input)

      const resident = await getResident(uid)
      expect(resident?.name).toBe(input.name)
      expect(resident?.block).toBe(input.block)
      expect(resident?.apartment).toBe(input.apartment)
      expect(resident?.role).toBe(input.role)
      expect(resident?.phone).toBe(input.phone)
    })
  })

  describe('service-contacts and events ordering', () => {
    it('serviceContacts come ordered by order ascending with the domain shape', async () => {
      const db = getDb()

      await db.collection('service-contacts').doc('second').set({
        name: 'Plumber',
        phone: '+77001112233',
        role: 'plumber',
        order: 2,
      })
      await db.collection('service-contacts').doc('first').set({
        name: 'Manager',
        phone: '+77001234567',
        role: 'manager',
        order: 1,
      })

      const { getServiceContacts } = await import(
        './service-contacts/service-contacts-store'
      )
      const contacts = await getServiceContacts()
      expect(contacts.map(c => c.id)).toEqual(['first', 'second'])
      expect(contacts[0]?.order).toBe(1)
      expect(contacts[0]?.role).toBe('manager')
      expect(contacts[1]?.order).toBe(2)
    })

    it('events come ordered by createdAt descending with createdAt as epoch millis', async () => {
      const db = getDb()
      const { Timestamp } = await import('./firestore')

      const newerDate = new Date('2026-06-20T09:00:00Z')

      await db
        .collection('posts')
        .doc('older')
        .set({
          kind: 'announcement',
          category: 'complex',
          title: 'Older',
          createdAt: Timestamp.fromDate(new Date('2026-06-01T09:00:00Z')),
        })
      await db
        .collection('posts')
        .doc('newer')
        .set({
          kind: 'offer',
          category: 'sell',
          title: 'Newer',
          createdAt: Timestamp.fromDate(newerDate),
        })

      const { getEvents } = await import('./events/events-store')
      const events = await getEvents(null, null, null, 'ru')
      expect(
        events.map(e =>
          e.type === 'announcement' || e.type === 'offer' ? e.id : '',
        ),
      ).toEqual(['newer', 'older'])
      expect(events[0]?.type).toBe('offer')
      expect(events[0]?.createdAt).toBe(newerDate.getTime())
    })
  })

  describe('events — lastVisit filter', () => {
    it('only events created after lastVisit are returned; events at or before are excluded', async () => {
      const db = getDb()
      const { Timestamp } = await import('./firestore')

      await db
        .collection('posts')
        .doc('seen')
        .set({
          kind: 'announcement',
          category: 'complex',
          title: 'Seen',
          createdAt: Timestamp.fromDate(new Date('2026-06-01T09:00:00Z')),
        })
      await db
        .collection('posts')
        .doc('fresh')
        .set({
          kind: 'announcement',
          category: 'management',
          title: 'Fresh',
          createdAt: Timestamp.fromDate(new Date('2026-06-20T09:00:00Z')),
        })

      const { getEvents } = await import('./events/events-store')
      const lastVisit = Timestamp.fromDate(new Date('2026-06-10T09:00:00Z'))
      const events = await getEvents(null, null, lastVisit, 'ru')

      expect(events.map(e => (e.type === 'announcement' ? e.id : ''))).toEqual([
        'fresh',
      ])
    })
  })

  describe('resident-store — markVisit', () => {
    it('writes residents/{uid}.lastVisit as a server timestamp', async () => {
      const { createResidentIfAbsent, markVisit } = await import(
        './resident/resident-store'
      )
      const { Timestamp } = await import('./firestore')

      const uid = 'firebase-uid-visit'
      await createResidentIfAbsent(uid, {
        apartment: 1,
        avatarUrl: null,
        block: 1,
        cars: [],
        isPhoneVisible: false,
        name: 'Visitor',
        phone: '+77000000000',
        role: 'owner',
      })

      await markVisit(uid)

      const db = getDb()
      const snap = await db.collection('residents').doc(uid).get()
      expect(snap.data()?.lastVisit).toBeInstanceOf(Timestamp)
    })
  })

  describe('events — live edits', () => {
    it('an updated source document is reflected on the next read without a redeploy', async () => {
      const db = getDb()
      const { Timestamp } = await import('./firestore')

      await db
        .collection('posts')
        .doc('e1')
        .set({
          kind: 'announcement',
          category: 'complex',
          title: 'Original',
          createdAt: Timestamp.fromDate(new Date('2026-06-01T09:00:00Z')),
        })

      const { getEvents } = await import('./events/events-store')
      const before = await getEvents(null, null, null, 'ru')
      expect(before[0]?.type === 'announcement' && before[0].title).toBe(
        'Original',
      )

      await db
        .collection('posts')
        .doc('e1')
        .set({
          kind: 'announcement',
          category: 'complex',
          title: 'Updated',
          createdAt: Timestamp.fromDate(new Date('2026-06-01T09:00:00Z')),
        })

      const after = await getEvents(null, null, null, 'ru')
      expect(after[0]?.type === 'announcement' && after[0].title).toBe(
        'Updated',
      )
    })
  })

  describe('Firestore security rules — deny-all for direct client access', () => {
    it('unauthenticated client cannot read or write residents/*, serviceContacts/*, events/*', async () => {
      const emulatorParts = parseEmulatorHost(EMULATOR ?? 'localhost:8080')
      const rulesContent = readFileSync(rulesPath, 'utf8')

      const testEnv = await initializeTestEnvironment({
        projectId: 'raiymbek-park-sa99',
        firestore: {
          host: emulatorParts.host,
          port: emulatorParts.port,
          rules: rulesContent,
        },
      })

      const unauthed = testEnv.unauthenticatedContext()
      const clientDb = unauthed.firestore()

      await assertFails(clientDb.collection('residents').doc('any').get())
      await assertFails(
        clientDb.collection('service-contacts').doc('any').get(),
      )
      await assertFails(clientDb.collection('events').doc('any').get())

      await assertFails(
        clientDb.collection('residents').doc('any').set({ name: 'hack' }),
      )
      await assertFails(
        clientDb.collection('events').doc('any').set({ text: 'hack' }),
      )

      await testEnv.cleanup()
    })
  })

  describe('resident-store — unknown uid', () => {
    it('returns null for an unknown uid without raising an error', async () => {
      const { getResident } = await import('./resident/resident-store')
      const resident = await getResident('uid-that-does-not-exist')
      expect(resident).toBeNull()
    })
  })

  describe('events and service-contacts — empty collections', () => {
    it('returns empty serviceContacts and events lists without an error', async () => {
      const { getServiceContacts } = await import(
        './service-contacts/service-contacts-store'
      )
      const { getEvents } = await import('./events/events-store')
      const contacts = await getServiceContacts()
      const events = await getEvents(null, null, null, 'ru')
      expect(contacts).toEqual([])
      expect(events).toEqual([])
    })
  })

  describe('events — no lastVisit means no filter', () => {
    it('returns all events ordered by createdAt descending when lastVisit is null', async () => {
      const db = getDb()
      const { Timestamp } = await import('./firestore')

      await db
        .collection('posts')
        .doc('old')
        .set({
          kind: 'announcement',
          category: 'complex',
          title: 'Old',
          createdAt: Timestamp.fromDate(new Date('2026-01-01T09:00:00Z')),
        })
      await db
        .collection('posts')
        .doc('new')
        .set({
          kind: 'offer',
          category: 'sell',
          title: 'New',
          createdAt: Timestamp.fromDate(new Date('2026-06-20T09:00:00Z')),
        })

      const { getEvents } = await import('./events/events-store')
      const events = await getEvents(null, null, null, 'ru')
      expect(
        events.map(e =>
          e.type === 'announcement' || e.type === 'offer' ? e.id : '',
        ),
      ).toEqual(['new', 'old'])
    })
  })

  describe('events — 10-event cap', () => {
    it('returns at most 10 events even when more exist after lastVisit', async () => {
      const db = getDb()
      const { Timestamp } = await import('./firestore')

      const batch = db.batch()
      Array.from({ length: 12 }, (_, i) => i).forEach(i => {
        const ref = db.collection('posts').doc(`event-${i}`)
        batch.set(ref, {
          kind: 'announcement',
          category: 'complex',
          title: `Event ${i}`,
          createdAt: Timestamp.fromDate(
            new Date(`2026-06-${String(i + 1).padStart(2, '0')}T09:00:00Z`),
          ),
        })
      })
      await batch.commit()

      const { getEvents } = await import('./events/events-store')
      const events = await getEvents(null, null, null, 'ru')
      expect(events).toHaveLength(10)
    })
  })
})
