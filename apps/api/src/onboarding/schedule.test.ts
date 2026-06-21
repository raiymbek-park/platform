import { describe, expect, it } from 'vitest'

import { cooldownFor, lockDurationSeconds, maxSends } from './schedule'

describe('cooldownFor', () => {
  it('send 1 → 60 s cooldown (happy S2 schedule baseline)', () => {
    expect(cooldownFor(1)).toBe(60)
  })

  it('send 2 → 120 s cooldown (edge S1 growing resend timer)', () => {
    expect(cooldownFor(2)).toBe(120)
  })

  it('send 3 → 300 s cooldown (edge S1 growing resend timer)', () => {
    expect(cooldownFor(3)).toBe(300)
  })

  it('send 4 → 600 s cooldown (edge S1 growing resend timer)', () => {
    expect(cooldownFor(4)).toBe(600)
  })

  it('send beyond table → clamped to 600 s', () => {
    expect(cooldownFor(99)).toBe(600)
  })

  it('send 0 → clamped to first entry, 60 s', () => {
    expect(cooldownFor(0)).toBe(60)
  })
})

describe('lockDurationSeconds', () => {
  it('lock duration is 86400 s (24 h) (edge S2)', () => {
    expect(lockDurationSeconds).toBe(86400)
  })
})

describe('maxSends', () => {
  it('maxSends is 4, matching the cooldown table length (edge S2 guard)', () => {
    expect(maxSends).toBe(4)
  })
})
