import { describe, expect, it, vi } from 'vitest'

vi.mock('firebase-admin/app', () => ({
  getApps: () => [{}],
  initializeApp: vi.fn(),
}))

const verifyIdTokenMock = vi.fn()

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken: verifyIdTokenMock }),
}))

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {},
  getFirestore: vi.fn(),
}))

describe('verifyIdToken — identity derived from Firebase ID token', () => {
  it('returns null when the token fails verification', async () => {
    verifyIdTokenMock.mockRejectedValueOnce(new Error('invalid token'))
    const { verifyIdToken } = await import('./firestore')
    expect(await verifyIdToken('garbage')).toBeNull()
  })

  it('maps a valid decoded token to { uid, phone }', async () => {
    verifyIdTokenMock.mockResolvedValueOnce({
      phone_number: '+77071234567',
      uid: 'uid-1',
    })
    const { verifyIdToken } = await import('./firestore')
    expect(await verifyIdToken('valid')).toEqual({
      phone: '+77071234567',
      uid: 'uid-1',
    })
  })

  it('maps a token without a phone claim to { uid, phone: null }', async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'uid-2' })
    const { verifyIdToken } = await import('./firestore')
    expect(await verifyIdToken('valid')).toEqual({ phone: null, uid: 'uid-2' })
  })
})
