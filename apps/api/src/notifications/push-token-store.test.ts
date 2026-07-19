import { beforeEach, describe, expect, test, vi } from 'vitest'

type StoredToken = {
  uid: string
  token: string
  data: Record<string, unknown>
}

const state = vi.hoisted(() => {
  const docs: StoredToken[] = []
  return { docs }
})

vi.mock('../firestore', () => {
  const remove = (uid: string, token: string) => {
    state.docs = state.docs.filter(
      doc => doc.uid !== uid || doc.token !== token,
    )
    return Promise.resolve()
  }
  const tokenDoc = (entry: StoredToken) => ({
    id: entry.token,
    data: () => entry.data,
    ref: {
      parent: { parent: { id: entry.uid } },
      delete: () => remove(entry.uid, entry.token),
    },
  })
  const tokensCollection = (uid: string) => ({
    doc: (token: string) => ({
      set: (record: Record<string, unknown>) => {
        state.docs = [
          ...state.docs.filter(doc => doc.uid !== uid || doc.token !== token),
          { data: record, token, uid },
        ]
        return Promise.resolve()
      },
      delete: () => remove(uid, token),
    }),
    get: () =>
      Promise.resolve({
        docs: state.docs.filter(doc => doc.uid === uid).map(tokenDoc),
      }),
  })
  return {
    FieldValue: { serverTimestamp: () => 'server-time' },
    getDb: () => ({
      collection: () => ({
        doc: (uid: string) => ({ collection: () => tokensCollection(uid) }),
      }),
      collectionGroup: () => ({
        get: () => Promise.resolve({ docs: state.docs.map(tokenDoc) }),
        where: (_field: string, _op: string, token: string) => ({
          get: () =>
            Promise.resolve({
              docs: state.docs.filter(doc => doc.token === token).map(tokenDoc),
            }),
        }),
      }),
    }),
  }
})

const {
  getResidentTokens,
  registerPushToken,
  residentIdsWithTokens,
  unregisterPushToken,
} = await import('./push-token-store')

beforeEach(() => {
  state.docs = []
})

describe('registerPushToken — idempotent per-device registration', () => {
  test('registering the same token twice leaves one registration', async () => {
    await registerPushToken('uid-a', 'token-1', 'ru')
    await registerPushToken('uid-a', 'token-1', 'en')

    expect(state.docs).toHaveLength(1)
    expect(state.docs[0]?.data).toMatchObject({ locale: 'en' })
  })

  test('reclaims the token from every other resident, keeping their other devices', async () => {
    await registerPushToken('uid-a', 'token-1', 'ru')
    await registerPushToken('uid-a', 'token-2', 'ru')

    await registerPushToken('uid-b', 'token-1', 'ru')

    await expect(getResidentTokens('uid-a')).resolves.toEqual([
      { locale: 'ru', token: 'token-2' },
    ])
    await expect(getResidentTokens('uid-b')).resolves.toEqual([
      { locale: 'ru', token: 'token-1' },
    ])
  })

  test('re-registering an own token does not delete it before the write', async () => {
    await registerPushToken('uid-a', 'token-1', 'ru')
    await registerPushToken('uid-a', 'token-1', 'ru')

    await expect(getResidentTokens('uid-a')).resolves.toEqual([
      { locale: 'ru', token: 'token-1' },
    ])
  })
})

describe('unregisterPushToken', () => {
  test('removes only the given device of the resident', async () => {
    await registerPushToken('uid-a', 'token-1', 'ru')
    await registerPushToken('uid-a', 'token-2', 'ru')

    await unregisterPushToken('uid-a', 'token-1')

    await expect(getResidentTokens('uid-a')).resolves.toEqual([
      { locale: 'ru', token: 'token-2' },
    ])
  })
})

describe('getResidentTokens — locale projection', () => {
  test('defaults an unsupported or missing stored locale to ru', async () => {
    state.docs = [
      { data: { locale: 'de' }, token: 'token-1', uid: 'uid-a' },
      { data: {}, token: 'token-2', uid: 'uid-a' },
      { data: { locale: 'kk' }, token: 'token-3', uid: 'uid-a' },
    ]

    await expect(getResidentTokens('uid-a')).resolves.toEqual([
      { locale: 'ru', token: 'token-1' },
      { locale: 'ru', token: 'token-2' },
      { locale: 'kk', token: 'token-3' },
    ])
  })
})

describe('residentIdsWithTokens — one entry per resident', () => {
  test('de-duplicates a resident holding several devices', async () => {
    state.docs = [
      { data: {}, token: 'token-1', uid: 'uid-a' },
      { data: {}, token: 'token-2', uid: 'uid-a' },
      { data: {}, token: 'token-3', uid: 'uid-b' },
    ]

    await expect(residentIdsWithTokens()).resolves.toEqual(['uid-a', 'uid-b'])
  })

  test('returns nothing when no device is registered', async () => {
    await expect(residentIdsWithTokens()).resolves.toEqual([])
  })
})
