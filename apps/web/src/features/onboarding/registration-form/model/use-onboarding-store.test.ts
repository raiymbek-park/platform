import { act, renderHook } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'

import { useOnboardingStore } from './use-onboarding-store'

const fullDraft = {
  apartment: '42',
  block: 1 as const,
  name: 'Alice',
  phone: '+77071234567',
  role: 'owner' as const,
}

beforeEach(() => {
  act(() => useOnboardingStore.getState().reset())
})

test('initial state has empty draft and null pendingPhone', () => {
  const { result } = renderHook(() => useOnboardingStore())

  expect(result.current.draft).toEqual({
    apartment: '',
    block: null,
    name: '',
    phone: '',
    role: null,
  })
  expect(result.current.pendingPhone).toBeNull()
})

test('setDraft updates the draft', () => {
  const { result } = renderHook(() => useOnboardingStore())

  act(() => result.current.setDraft(fullDraft))

  expect(result.current.draft).toEqual(fullDraft)
})

test('setPendingPhone stores the phone', () => {
  const { result } = renderHook(() => useOnboardingStore())

  act(() => result.current.setPendingPhone('+77071234567'))

  expect(result.current.pendingPhone).toBe('+77071234567')
})

test('reset clears draft and pendingPhone', () => {
  const { result } = renderHook(() => useOnboardingStore())

  act(() => {
    result.current.setDraft(fullDraft)
    result.current.setPendingPhone('+77071234567')
  })
  act(() => result.current.reset())

  expect(result.current.draft).toEqual({
    apartment: '',
    block: null,
    name: '',
    phone: '',
    role: null,
  })
  expect(result.current.pendingPhone).toBeNull()
})

test('persistence shape uses the onboarding storage key', () => {
  const { result } = renderHook(() => useOnboardingStore())

  act(() => result.current.setDraft(fullDraft))

  const raw = localStorage.getItem('onboarding')
  expect(raw).not.toBeNull()
  const parsed = JSON.parse(raw ?? '{}')
  expect(parsed.state.draft).toEqual(fullDraft)
})
