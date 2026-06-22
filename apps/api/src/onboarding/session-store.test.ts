import { beforeEach, describe, expect, it } from 'vitest'

import { lockDurationSeconds, maxSends } from './schedule'
import {
  getSession,
  issueTokens,
  recordSend,
  resetStore,
  rotateRefresh,
} from './session-store'

const PHONE = '+77071234567'
const NOW = 1_700_000_000_000

const sendUntilLocked = () =>
  Array.from({ length: maxSends + 1 }, (_, i) =>
    recordSend(PHONE, NOW + i * 700_000),
  )

const lockExpiry = NOW + maxSends * 700_000 + lockDurationSeconds * 1000

beforeEach(() => {
  resetStore()
})

describe('getSession — expired lockout resets to neutral (edge S5)', () => {
  it('after lockedUntil passes, the session reads as neutral (sendCount 0, no code)', () => {
    sendUntilLocked()
    const cleared = getSession(PHONE, lockExpiry + 1)
    expect(cleared.sendCount).toBe(0)
    expect(cleared.code).toBeNull()
    expect(cleared.lockedUntil).toBeNull()
  })

  it('the first send after the lockout expires starts a fresh 60 s cooldown', () => {
    sendUntilLocked()
    const fresh = recordSend(PHONE, lockExpiry + 1)
    expect(fresh.sendCount).toBe(1)
    expect(fresh.resendAvailableAt).toBe(lockExpiry + 1 + 60 * 1000)
    expect(fresh.lockedUntil).toBeNull()
  })
})

describe('rotateRefresh — expired token is rejected (error S7)', () => {
  const resident = {
    apartment: 10,
    block: 2,
    name: 'Test User',
    phone: PHONE,
    role: 'resident',
  }

  it('token presented after refreshTokenExpiresAt returns null', () => {
    const pair = issueTokens(resident, NOW)
    const pastExpiry = pair.refreshTokenExpiresAt + 1
    expect(rotateRefresh(pair.refreshToken, pastExpiry)).toBeNull()
  })
})
