import { TRPCError } from '@trpc/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { appRouter } from '../router'
import { resetStore } from './session-store'

const caller = appRouter.createCaller({})

const PHONE = '+77071234567'
const PHONE_8 = '87071234567'

const validResident = {
  apartment: 42,
  block: 1,
  name: 'Test Resident',
  phone: PHONE,
  role: 'owner' as const,
}

beforeEach(() => {
  resetStore()
  vi.restoreAllMocks()
})

const expectTrpcCode = async (promise: Promise<unknown>, code: string) => {
  await expect(promise).rejects.toSatisfy(
    e => e instanceof TRPCError && e.code === code,
  )
}

const mockNowSequence = (values: number[]) => {
  let idx = 0
  vi.spyOn(Date, 'now').mockImplementation(
    () => values[idx++] ?? values.at(-1) ?? 0,
  )
}

const LOCK_AT = 1_700_001_084_000 // 5th send trips the 24 h lock
const LOCK_NOW = [
  1_700_000_000_000,
  1_700_000_061_000,
  1_700_000_182_000,
  1_700_000_483_000,
  LOCK_AT,
]

const sendOtp = () => caller.otp.send({ phone: PHONE })

const reachLock = async (...afterLock: number[]) => {
  mockNowSequence([...LOCK_NOW, ...afterLock])
  await sendOtp()
  await sendOtp()
  await sendOtp()
  await sendOtp()
  return sendOtp()
}

describe('otp.send — first send opens session (happy S2)', () => {
  it('returns sendCount=1 and resendAvailableAt ≈ now+60 s', async () => {
    const before = Date.now()
    const result = await caller.otp.send({ phone: PHONE })
    const after = Date.now()

    expect(result.sendCount).toBe(1)
    expect(result.resendAvailableAt).toBeGreaterThanOrEqual(before + 60_000)
    expect(result.resendAvailableAt).toBeLessThanOrEqual(after + 60_000)
    expect(result.lockedUntil).toBeNull()
  })

  it('8-prefix phone is normalized — session is stored under +7 form', async () => {
    const result = await caller.otp.send({ phone: PHONE_8 })
    expect(result.sendCount).toBe(1)
  })
})

describe('otp.send — growing cooldown (edge S1)', () => {
  it('cooldown sequence follows 60→120→300→600 s across sends', async () => {
    // Mock Date.now so each send sees a timestamp past the previous cooldown.
    // Cooldowns: send1→+60 s, send2→+120 s, send3→+300 s, send4→+600 s.
    const T = 1_700_000_000_000
    mockNowSequence([
      T, // send 1 — t=0, cooldown expires at T+60 s
      T + 61_000, // send 2 — past 60 s cooldown; cooldown expires at t+120 s
      T + 182_000, // send 3 — past 120 s cooldown; cooldown expires at t+300 s
      T + 483_000, // send 4 — past 300 s cooldown; cooldown expires at t+600 s
    ])

    const s1 = await caller.otp.send({ phone: PHONE })
    expect(s1.resendAvailableAt).toBe(T + 60_000)

    const s2 = await caller.otp.send({ phone: PHONE })
    expect(s2.resendAvailableAt).toBe(T + 61_000 + 120_000)

    const s3 = await caller.otp.send({ phone: PHONE })
    expect(s3.resendAvailableAt).toBe(T + 182_000 + 300_000)

    const s4 = await caller.otp.send({ phone: PHONE })
    expect(s4.resendAvailableAt).toBe(T + 483_000 + 600_000)
  })
})

describe('otp.send — 5th send locks the number (edge S2)', () => {
  it('5th send returns lockedUntil = now+86400 s', async () => {
    const locked = await reachLock()
    expect(locked.lockedUntil).toBe(LOCK_AT + 86400 * 1000)
  })
})

describe('otp.send — locked number is rejected (edge S2 guard)', () => {
  it('send while locked → FORBIDDEN', async () => {
    await reachLock(1_700_001_100_000) // 6th send — within the 24 h lock window
    await expectTrpcCode(sendOtp(), 'FORBIDDEN')
  })
})

describe('otp.send — active cooldown is rejected (error-states S9)', () => {
  it('second send before the wait elapses → TOO_MANY_REQUESTS', async () => {
    await caller.otp.send({ phone: PHONE })
    await expectTrpcCode(caller.otp.send({ phone: PHONE }), 'TOO_MANY_REQUESTS')
  })

  it('the refused resend leaves the code and the running wait unchanged (error-states S9)', async () => {
    const T = 1_700_000_000_000
    // send 1 at T (wait → T+60s), refused resend attempted 30s later (within wait).
    mockNowSequence([T, T + 30_000, T + 30_000])

    const first = await caller.otp.send({ phone: PHONE })
    await expectTrpcCode(caller.otp.send({ phone: PHONE }), 'TOO_MANY_REQUESTS')

    const status = await caller.otp.status({ phone: PHONE })
    // The active code is still live and the wait timestamp did not move.
    expect(status.hasActiveCode).toBe(true)
    expect(status.sendCount).toBe(first.sendCount)
    expect(status.resendAvailableAt).toBe(first.resendAvailableAt)
  })
})

describe('otp.status — unseen phone returns neutral state (edge S9)', () => {
  it('never-seen phone: sendCount=0, no code, no cooldown, no lock', async () => {
    const status = await caller.otp.status({ phone: PHONE })
    expect(status.sendCount).toBe(0)
    expect(status.hasActiveCode).toBe(false)
    expect(status.resendAvailableAt).toBeNull()
    expect(status.lockedUntil).toBeNull()
    expect(status.verified).toBe(false)
  })
})

describe('otp.status — reflects session after sends', () => {
  it('status after first send shows sendCount=1 and active cooldown', async () => {
    const before = Date.now()
    await caller.otp.send({ phone: PHONE })
    const status = await caller.otp.status({ phone: PHONE })

    expect(status.sendCount).toBe(1)
    expect(status.hasActiveCode).toBe(true)
    expect(status.resendAvailableAt).toBeGreaterThan(before)
  })

  it('status after lock shows lockedUntil (edge S7 restore on relaunch)', async () => {
    await reachLock()
    const status = await caller.otp.status({ phone: PHONE })
    expect(status.lockedUntil).not.toBeNull()
  })
})

describe('otp.verify — correct code succeeds (happy S5)', () => {
  it('correct code 1234 → returns { verified: true }', async () => {
    await caller.otp.send({ phone: PHONE })
    const result = await caller.otp.verify({ code: '1234', phone: PHONE })
    expect(result.verified).toBe(true)
  })
})

describe('otp.verify — wrong code burns the attempt (error S1)', () => {
  it('wrong code → BAD_REQUEST with attempt consumed', async () => {
    await caller.otp.send({ phone: PHONE })
    await expectTrpcCode(
      caller.otp.verify({ code: '9999', phone: PHONE }),
      'BAD_REQUEST',
    )
  })
})

describe('otp.verify — used attempt is rejected (error S2)', () => {
  it('re-verify after used attempt → BAD_REQUEST', async () => {
    await caller.otp.send({ phone: PHONE })
    await expect(
      caller.otp.verify({ code: '9999', phone: PHONE }),
    ).rejects.toBeInstanceOf(TRPCError)

    await expectTrpcCode(
      caller.otp.verify({ code: '1234', phone: PHONE }),
      'BAD_REQUEST',
    )
  })
})

describe('otp.verify — fresh send restores the attempt (error S3)', () => {
  it('new code after used attempt allows one more verify', async () => {
    const T = 1_700_000_000_000
    // send 1 at T, then send 2 past the 60 s cooldown
    mockNowSequence([T, T + 61_000])

    await caller.otp.send({ phone: PHONE })
    await expect(
      caller.otp.verify({ code: '9999', phone: PHONE }),
    ).rejects.toBeInstanceOf(TRPCError)
    await caller.otp.send({ phone: PHONE })
    const result = await caller.otp.verify({ code: '1234', phone: PHONE })
    expect(result.verified).toBe(true)
  })
})

describe('otp.verify — a check while locked is refused without consuming an attempt (error-states S10)', () => {
  it('verify while locked → FORBIDDEN with the time remaining until unlock in the message', async () => {
    await reachLock(1_700_001_100_000) // verify attempt within the lock window
    await expect(
      caller.otp.verify({ code: '1234', phone: PHONE }),
    ).rejects.toSatisfy(
      e =>
        e instanceof TRPCError &&
        e.code === 'FORBIDDEN' &&
        /locked/i.test(e.message) &&
        /\d+s until unlock/.test(e.message),
    )
  })

  it('the refused check does not consume the verification attempt — verifyUsed stays false (error-states S10)', async () => {
    await reachLock(
      1_700_001_100_000, // verify attempt — within lock window, refused
      1_700_001_200_000, // status read
    )
    await expectTrpcCode(
      caller.otp.verify({ code: '1234', phone: PHONE }),
      'FORBIDDEN',
    )

    const status = await caller.otp.status({ phone: PHONE })
    expect(status.verifyUsed).toBe(false)
  })
})

describe('resident.register — verified phone issues token pair (happy S5)', () => {
  it('returns accessToken, refreshToken, expiresAt, and resident after verify', async () => {
    await caller.otp.send({ phone: PHONE })
    await caller.otp.verify({ code: '1234', phone: PHONE })

    const before = Date.now()
    const reg = await caller.resident.register(validResident)
    const after = Date.now()

    expect(typeof reg.accessToken).toBe('string')
    expect(typeof reg.refreshToken).toBe('string')
    expect(reg.accessTokenExpiresAt).toBeGreaterThan(before)
    expect(reg.accessTokenExpiresAt).toBeLessThanOrEqual(after + 3600 * 1000)
    expect(reg.refreshTokenExpiresAt).toBeGreaterThan(before)
    expect(reg.resident.name).toBe('Test Resident')
  })
})

describe('resident.register — unverified phone is rejected', () => {
  it('register without prior verify → UNAUTHORIZED', async () => {
    await caller.otp.send({ phone: PHONE })
    await expectTrpcCode(
      caller.resident.register(validResident),
      'UNAUTHORIZED',
    )
  })
})

describe('auth.refresh — valid token is rotated (happy S6)', () => {
  it('returns a new token pair distinct from the original', async () => {
    await caller.otp.send({ phone: PHONE })
    await caller.otp.verify({ code: '1234', phone: PHONE })
    const reg = await caller.resident.register(validResident)

    const refreshed = await caller.auth.refresh({
      refreshToken: reg.refreshToken,
    })
    expect(typeof refreshed.accessToken).toBe('string')
    expect(typeof refreshed.refreshToken).toBe('string')
    expect(refreshed.refreshToken).not.toBe(reg.refreshToken)
    expect(refreshed.accessToken).not.toBe(reg.accessToken)
  })
})

describe('auth.refresh — expired / invalid token is rejected (error S7)', () => {
  it('unknown token → UNAUTHORIZED', async () => {
    await expectTrpcCode(
      caller.auth.refresh({ refreshToken: 'fake-token' }),
      'UNAUTHORIZED',
    )
  })
})

describe('auth.refresh — reused rotated token is rejected (edge S10)', () => {
  it('submitting an already-rotated token a second time → UNAUTHORIZED', async () => {
    await caller.otp.send({ phone: PHONE })
    await caller.otp.verify({ code: '1234', phone: PHONE })
    const reg = await caller.resident.register(validResident)

    await caller.auth.refresh({ refreshToken: reg.refreshToken })

    await expectTrpcCode(
      caller.auth.refresh({ refreshToken: reg.refreshToken }),
      'UNAUTHORIZED',
    )
  })
})
