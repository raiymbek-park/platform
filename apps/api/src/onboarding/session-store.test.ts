import { beforeEach, describe, expect, it } from 'vitest'

import { lockDurationSeconds, maxSends } from './schedule'
import {
  getSession,
  issueTokens,
  recordSend,
  recordVerify,
  resetStore,
  rotateRefresh,
} from './session-store'

const PHONE = '+77071234567'
const NOW = 1_700_000_000_000

beforeEach(() => {
  resetStore()
})

describe('getSession — unseen phone returns neutral state (edge S9)', () => {
  it('never-seen phone has sendCount 0, no code, no cooldown, no lock', () => {
    const session = getSession(PHONE, NOW)
    expect(session.sendCount).toBe(0)
    expect(session.code).toBeNull()
    expect(session.resendAvailableAt).toBeNull()
    expect(session.lockedUntil).toBeNull()
    expect(session.verified).toBe(false)
    expect(session.verifyUsed).toBe(false)
  })
})

describe('recordSend — first send (happy S2)', () => {
  it('sendCount becomes 1 and resendAvailableAt is now+60 s', () => {
    const session = recordSend(PHONE, NOW)
    expect(session.sendCount).toBe(1)
    expect(session.resendAvailableAt).toBe(NOW + 60 * 1000)
  })

  it('code is set to 1234', () => {
    const session = recordSend(PHONE, NOW)
    expect(session.code).toBe('1234')
  })

  it('lockedUntil is null after the first send', () => {
    const session = recordSend(PHONE, NOW)
    expect(session.lockedUntil).toBeNull()
  })

  it('verifyUsed is reset to false after a fresh send (error S3 restore)', () => {
    recordSend(PHONE, NOW)
    recordVerify(PHONE, '9999', NOW)
    const after = recordSend(PHONE, NOW + 65_000)
    expect(after.verifyUsed).toBe(false)
  })
})

describe('recordSend — growing cooldown schedule (edge S1)', () => {
  it('send 2 → resendAvailableAt = now+120 s', () => {
    recordSend(PHONE, NOW)
    const s2 = recordSend(PHONE, NOW + 65_000)
    expect(s2.resendAvailableAt).toBe(NOW + 65_000 + 120 * 1000)
  })

  it('send 3 → resendAvailableAt = now+300 s', () => {
    recordSend(PHONE, NOW)
    recordSend(PHONE, NOW + 65_000)
    const s3 = recordSend(PHONE, NOW + 250_000)
    expect(s3.resendAvailableAt).toBe(NOW + 250_000 + 300 * 1000)
  })

  it('send 4 → resendAvailableAt = now+600 s', () => {
    recordSend(PHONE, NOW)
    recordSend(PHONE, NOW + 65_000)
    recordSend(PHONE, NOW + 250_000)
    const s4 = recordSend(PHONE, NOW + 600_000)
    expect(s4.resendAvailableAt).toBe(NOW + 600_000 + 600 * 1000)
  })
})

describe('recordSend — 5th send locks the number (edge S2)', () => {
  it(`5th send (sendCount=${maxSends + 1}) sets lockedUntil to now+86400 s`, () => {
    for (let i = 0; i < maxSends; i++) {
      recordSend(PHONE, NOW + i * 700_000)
    }
    const locked = recordSend(PHONE, NOW + maxSends * 700_000)
    expect(locked.lockedUntil).toBe(
      NOW + maxSends * 700_000 + lockDurationSeconds * 1000,
    )
    expect(locked.sendCount).toBe(maxSends + 1)
  })
})

describe('recordVerify — correct code sets verified (happy S5)', () => {
  it('correct code 1234 → verified becomes true', () => {
    recordSend(PHONE, NOW)
    const result = recordVerify(PHONE, '1234', NOW)
    expect(result.verified).toBe(true)
    expect(result.verifyUsed).toBe(true)
  })
})

describe('recordVerify — wrong code burns the attempt (error S1)', () => {
  it('wrong code → verified stays false, verifyUsed becomes true', () => {
    recordSend(PHONE, NOW)
    const result = recordVerify(PHONE, '9999', NOW)
    expect(result.verified).toBe(false)
    expect(result.verifyUsed).toBe(true)
  })
})

describe('getSession — expired lockout resets to neutral (edge S5)', () => {
  it('after lockedUntil passes, the session reads as neutral (sendCount 0, no code)', () => {
    for (let i = 0; i <= maxSends; i++) {
      recordSend(PHONE, NOW + i * 700_000)
    }
    const lockExpiry = NOW + maxSends * 700_000 + lockDurationSeconds * 1000
    const cleared = getSession(PHONE, lockExpiry + 1)
    expect(cleared.sendCount).toBe(0)
    expect(cleared.code).toBeNull()
    expect(cleared.lockedUntil).toBeNull()
  })

  it('the first send after the lockout expires starts a fresh 60 s cooldown', () => {
    for (let i = 0; i <= maxSends; i++) {
      recordSend(PHONE, NOW + i * 700_000)
    }
    const lockExpiry = NOW + maxSends * 700_000 + lockDurationSeconds * 1000
    const fresh = recordSend(PHONE, lockExpiry + 1)
    expect(fresh.sendCount).toBe(1)
    expect(fresh.resendAvailableAt).toBe(lockExpiry + 1 + 60 * 1000)
    expect(fresh.lockedUntil).toBeNull()
  })
})

describe('issueTokens', () => {
  const resident = {
    apartment: 10,
    block: 'B',
    name: 'Test User',
    phone: PHONE,
    role: 'resident',
  }

  it('returns an access token, refresh token, and expiry timestamps (happy S5)', () => {
    const pair = issueTokens(resident, NOW)
    expect(typeof pair.accessToken).toBe('string')
    expect(typeof pair.refreshToken).toBe('string')
    expect(pair.accessTokenExpiresAt).toBe(NOW + 3600 * 1000)
    expect(pair.refreshTokenExpiresAt).toBe(NOW + 2592000 * 1000)
  })
})

describe('rotateRefresh — valid token issues a new pair (happy S6)', () => {
  const resident = {
    apartment: 10,
    block: 'B',
    name: 'Test User',
    phone: PHONE,
    role: 'resident',
  }

  it('valid unexpired refresh token returns a new token pair', () => {
    const first = issueTokens(resident, NOW)
    const rotated = rotateRefresh(first.refreshToken, NOW + 1000)
    expect(rotated).not.toBeNull()
    expect(typeof rotated?.accessToken).toBe('string')
    expect(typeof rotated?.refreshToken).toBe('string')
  })

  it('rotated pair has different tokens from the original', () => {
    const first = issueTokens(resident, NOW)
    const rotated = rotateRefresh(first.refreshToken, NOW + 1000)
    expect(rotated?.refreshToken).not.toBe(first.refreshToken)
    expect(rotated?.accessToken).not.toBe(first.accessToken)
  })
})

describe('rotateRefresh — reused rotated token is rejected (edge S10)', () => {
  const resident = {
    apartment: 10,
    block: 'B',
    name: 'Test User',
    phone: PHONE,
    role: 'resident',
  }

  it('submitting the already-rotated token a second time returns null', () => {
    const first = issueTokens(resident, NOW)
    rotateRefresh(first.refreshToken, NOW + 1000)
    const reused = rotateRefresh(first.refreshToken, NOW + 2000)
    expect(reused).toBeNull()
  })
})

describe('rotateRefresh — expired token is rejected (error S7)', () => {
  const resident = {
    apartment: 10,
    block: 'B',
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

describe('rotateRefresh — unknown token is rejected', () => {
  it('completely unknown refresh token returns null', () => {
    expect(rotateRefresh('not-a-real-token', NOW)).toBeNull()
  })
})

describe('resetStore — state isolation between tests', () => {
  it('after reset, a previously sent phone has no session', () => {
    recordSend(PHONE, NOW)
    resetStore()
    const session = getSession(PHONE, NOW)
    expect(session.sendCount).toBe(0)
    expect(session.code).toBeNull()
  })
})
