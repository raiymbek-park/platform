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
      clearCollection(db, 'serviceContacts'),
      clearCollection(db, 'events'),
    ])
  }

  beforeEach(clearAll)
  afterAll(clearAll)

  describe('resident-store — register writes residents/{uid}', () => {
    it('stored profile is readable back under the same uid', async () => {
      const { createResident, getResident } = await import(
        './onboarding/resident-store'
      )

      const input = {
        apartment: 42,
        block: 1,
        name: 'Иван Петров',
        phone: '+77071234567',
        role: 'owner',
      }
      const uid = 'firebase-uid-happy-2'
      await createResident(uid, input)

      const resident = await getResident(uid)
      expect(resident).toEqual(input)
    })
  })

  describe('resident-store — profile read', () => {
    it('returned profile equals the stored name, block, apartment, role, and phone', async () => {
      const { createResident, getResident } = await import(
        './onboarding/resident-store'
      )

      const input = {
        apartment: 10,
        block: 2,
        name: 'Айгерим Сатыбалды',
        phone: '+77011112233',
        role: 'tenant',
      }
      const uid = 'firebase-uid-happy-3'
      await createResident(uid, input)

      const resident = await getResident(uid)
      expect(resident?.name).toBe(input.name)
      expect(resident?.block).toBe(input.block)
      expect(resident?.apartment).toBe(input.apartment)
      expect(resident?.role).toBe(input.role)
      expect(resident?.phone).toBe(input.phone)
    })
  })

  describe('home content — contacts and changes ordering', () => {
    it('contacts come from serviceContacts ordered by order ascending', async () => {
      const db = getDb()

      await db.collection('serviceContacts').doc('second').set({
        name: 'Plumber',
        phone: '+77001112233',
        role: 'plumber',
        glyph: 'droplets',
        tone: 'info',
        order: 2,
      })
      await db.collection('serviceContacts').doc('first').set({
        name: 'Manager',
        phone: '+77001234567',
        role: 'manager',
        glyph: 'shield',
        tone: 'brand',
        order: 1,
      })

      const { getContacts } = await import('./home/content')
      const contacts = await getContacts()
      expect(contacts.map(c => c.id)).toEqual(['first', 'second'])
    })

    it('changes come from events ordered by createdAt descending', async () => {
      const db = getDb()
      const { Timestamp } = await import('./firestore')

      await db
        .collection('events')
        .doc('older')
        .set({
          kind: 'announcement',
          title: 'Older',
          text: 'Older event',
          glyph: 'megaphone',
          tone: 'brand',
          createdAt: Timestamp.fromDate(new Date('2026-06-01T09:00:00Z')),
        })
      await db
        .collection('events')
        .doc('newer')
        .set({
          kind: 'utility',
          title: 'Newer',
          text: 'Newer event',
          glyph: 'droplet-off',
          tone: 'info',
          createdAt: Timestamp.fromDate(new Date('2026-06-20T09:00:00Z')),
        })

      const { getChanges } = await import('./home/content')
      const changes = await getChanges(null)
      expect(changes.map(c => c.id)).toEqual(['newer', 'older'])
      expect(changes[0]?.text).toBe('Newer event')
    })
  })

  describe('home content — lastVisit filter', () => {
    it('only events created after lastVisit are returned; events at or before are excluded', async () => {
      const db = getDb()
      const { Timestamp } = await import('./firestore')

      await db
        .collection('events')
        .doc('seen')
        .set({
          kind: 'announcement',
          title: 'Seen',
          text: 'Already seen',
          glyph: 'megaphone',
          tone: 'brand',
          createdAt: Timestamp.fromDate(new Date('2026-06-01T09:00:00Z')),
        })
      await db
        .collection('events')
        .doc('fresh')
        .set({
          kind: 'utility',
          title: 'Fresh',
          text: 'New since last visit',
          glyph: 'droplet-off',
          tone: 'info',
          createdAt: Timestamp.fromDate(new Date('2026-06-20T09:00:00Z')),
        })

      const { getChanges } = await import('./home/content')
      const lastVisit = Timestamp.fromDate(new Date('2026-06-10T09:00:00Z'))
      const changes = await getChanges(lastVisit)

      expect(changes.map(c => c.id)).toEqual(['fresh'])
    })
  })

  describe('resident-store — markVisit', () => {
    it('writes residents/{uid}.lastVisit as a server timestamp', async () => {
      const { createResident, markVisit } = await import(
        './onboarding/resident-store'
      )
      const { Timestamp } = await import('./firestore')

      const uid = 'firebase-uid-visit'
      await createResident(uid, {
        apartment: 1,
        block: 1,
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

  describe('home content — live edits', () => {
    it('an updated events document is reflected on the next read without a redeploy', async () => {
      const db = getDb()
      const { Timestamp } = await import('./firestore')

      await db
        .collection('events')
        .doc('e1')
        .set({
          kind: 'announcement',
          title: 'Original',
          text: 'Original',
          glyph: 'megaphone',
          tone: 'brand',
          createdAt: Timestamp.fromDate(new Date('2026-06-01T09:00:00Z')),
        })

      const { getChanges } = await import('./home/content')
      const before = await getChanges(null)
      expect(before[0]?.text).toBe('Original')

      await db
        .collection('events')
        .doc('e1')
        .set({
          kind: 'announcement',
          title: 'Updated',
          text: 'Updated without deploy',
          glyph: 'megaphone',
          tone: 'brand',
          createdAt: Timestamp.fromDate(new Date('2026-06-01T09:00:00Z')),
        })

      const after = await getChanges(null)
      expect(after[0]?.text).toBe('Updated without deploy')
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
      await assertFails(clientDb.collection('serviceContacts').doc('any').get())
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
      const { getResident } = await import('./onboarding/resident-store')
      const resident = await getResident('uid-that-does-not-exist')
      expect(resident).toBeNull()
    })
  })

  describe('home content — empty collections', () => {
    it('returns empty contacts and changes lists without an error', async () => {
      const { getChanges, getContacts } = await import('./home/content')
      const contacts = await getContacts()
      const changes = await getChanges(null)
      expect(contacts).toEqual([])
      expect(changes).toEqual([])
    })
  })

  describe('home content — no lastVisit means no filter', () => {
    it('returns all events ordered by createdAt descending when lastVisit is null', async () => {
      const db = getDb()
      const { Timestamp } = await import('./firestore')

      await db
        .collection('events')
        .doc('old')
        .set({
          kind: 'announcement',
          title: 'Old',
          text: 'Old event',
          glyph: 'megaphone',
          tone: 'brand',
          createdAt: Timestamp.fromDate(new Date('2026-01-01T09:00:00Z')),
        })
      await db
        .collection('events')
        .doc('new')
        .set({
          kind: 'utility',
          title: 'New',
          text: 'New event',
          glyph: 'droplet-off',
          tone: 'info',
          createdAt: Timestamp.fromDate(new Date('2026-06-20T09:00:00Z')),
        })

      const { getChanges } = await import('./home/content')
      const changes = await getChanges(null)
      expect(changes.map(c => c.id)).toEqual(['new', 'old'])
    })
  })

  describe('home content — 10-event cap', () => {
    it('returns at most 10 events even when more exist after lastVisit', async () => {
      const db = getDb()
      const { Timestamp } = await import('./firestore')

      const batch = db.batch()
      Array.from({ length: 12 }, (_, i) => i).forEach(i => {
        const ref = db.collection('events').doc(`event-${i}`)
        batch.set(ref, {
          kind: 'announcement',
          title: `Event ${i}`,
          text: `Text ${i}`,
          glyph: 'megaphone',
          tone: 'brand',
          createdAt: Timestamp.fromDate(
            new Date(`2026-06-${String(i + 1).padStart(2, '0')}T09:00:00Z`),
          ),
        })
      })
      await batch.commit()

      const { getChanges } = await import('./home/content')
      const changes = await getChanges(null)
      expect(changes).toHaveLength(10)
    })
  })

  describe('home content — unknown glyph/tone fallback', () => {
    it('items with unknown glyph fall back to megaphone and unknown tone falls back to brand', async () => {
      const db = getDb()
      const { Timestamp } = await import('./firestore')

      await db.collection('serviceContacts').doc('unknown-icons').set({
        name: 'Test Contact',
        phone: '+77001234567',
        role: 'other',
        glyph: 'nonexistent-icon',
        tone: 'nonexistent-tone',
        order: 1,
      })
      await db
        .collection('events')
        .doc('unknown-icons')
        .set({
          kind: 'announcement',
          title: 'Unknown icons',
          text: 'Event with unknown glyph and tone',
          glyph: 'nonexistent-icon',
          tone: 'nonexistent-tone',
          createdAt: Timestamp.fromDate(new Date('2026-06-01T09:00:00Z')),
        })

      const { getChanges, getContacts } = await import('./home/content')
      const contacts = await getContacts()
      const changes = await getChanges(null)

      expect(contacts[0]?.glyph).toBe('megaphone')
      expect(contacts[0]?.tone).toBe('brand')
      expect(changes[0]?.glyph).toBe('megaphone')
      expect(changes[0]?.tone).toBe('brand')
    })
  })
})
