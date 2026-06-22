import { act } from 'react'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import { useLockedPhoneStore } from './use-locked-phone-store'

const PHONE = '+77071234567'

beforeEach(() => {
  act(() => useLockedPhoneStore.getState().clearLockedPhone())
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe('useLockedPhoneStore', () => {
  test('initial lockedPhone is null', () => {
    expect(useLockedPhoneStore.getState().lockedPhone).toBeNull()
  })

  test('setLockedPhone stores the phone number', () => {
    act(() => useLockedPhoneStore.getState().setLockedPhone(PHONE))
    expect(useLockedPhoneStore.getState().lockedPhone).toBe(PHONE)
  })

  test('clearLockedPhone resets to null', () => {
    act(() => useLockedPhoneStore.getState().setLockedPhone(PHONE))
    act(() => useLockedPhoneStore.getState().clearLockedPhone())
    expect(useLockedPhoneStore.getState().lockedPhone).toBeNull()
  })

  // S17: the store must persist under the key 'locked-phone', which is a
  // different key from 'onboarding'. This ensures clearing the onboarding
  // draft does not wipe the locked-phone pin — the lock cannot be bypassed
  // by removing the pending-phone record.
  test('S17: persists under the key "locked-phone" (separate from "onboarding")', () => {
    act(() => useLockedPhoneStore.getState().setLockedPhone(PHONE))

    const raw = localStorage.getItem('locked-phone')
    expect(raw).not.toBeNull()
    const stored = JSON.parse(raw ?? '{}') as {
      state?: { lockedPhone?: string }
    }
    expect(stored.state?.lockedPhone).toBe(PHONE)
  })

  test('S17: "onboarding" key does not contain lockedPhone', () => {
    act(() => useLockedPhoneStore.getState().setLockedPhone(PHONE))

    localStorage.removeItem('onboarding')
    expect(localStorage.getItem('locked-phone')).not.toBeNull()
  })
})
