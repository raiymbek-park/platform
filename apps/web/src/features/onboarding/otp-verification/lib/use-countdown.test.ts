import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { useCountdown } from './use-countdown'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

test('edge S1 — returns remaining seconds and M:SS label from resendAvailableAt', () => {
  const now = 1_000_000_000_000
  vi.setSystemTime(now)
  const resendAvailableAt = now + 60_000

  const { result } = renderHook(() => useCountdown(resendAvailableAt))

  expect(result.current.remaining).toBe(60)
  expect(result.current.mmss).toBe('1:00')
})

test('edge S1 — ticks down every second', () => {
  const now = 1_000_000_000_000
  vi.setSystemTime(now)
  const resendAvailableAt = now + 5_000

  const { result } = renderHook(() => useCountdown(resendAvailableAt))
  expect(result.current.remaining).toBe(5)

  act(() => vi.advanceTimersByTime(1000))
  expect(result.current.remaining).toBe(4)
  expect(result.current.mmss).toBe('0:04')

  act(() => vi.advanceTimersByTime(3000))
  expect(result.current.remaining).toBe(1)
})

test('edge S1 — stops at 0 and does not go negative', () => {
  const now = 1_000_000_000_000
  vi.setSystemTime(now)
  const resendAvailableAt = now + 2_000

  const { result } = renderHook(() => useCountdown(resendAvailableAt))

  act(() => vi.advanceTimersByTime(5000))
  expect(result.current.remaining).toBe(0)
  expect(result.current.mmss).toBe('0:00')
})

test('edge S1 — null resendAvailableAt returns 0 remaining', () => {
  const { result } = renderHook(() => useCountdown(null))

  expect(result.current.remaining).toBe(0)
  expect(result.current.mmss).toBe('0:00')
})

test('edge S1 — 120s cooldown formats as 2:00', () => {
  const now = 1_000_000_000_000
  vi.setSystemTime(now)
  const resendAvailableAt = now + 120_000

  const { result } = renderHook(() => useCountdown(resendAvailableAt))

  expect(result.current.remaining).toBe(120)
  expect(result.current.mmss).toBe('2:00')
})

test('edge S1 — 300s cooldown formats as 5:00', () => {
  const now = 1_000_000_000_000
  vi.setSystemTime(now)
  const resendAvailableAt = now + 300_000

  const { result } = renderHook(() => useCountdown(resendAvailableAt))

  expect(result.current.remaining).toBe(300)
  expect(result.current.mmss).toBe('5:00')
})

test('edge S1 — 600s cooldown formats as 10:00', () => {
  const now = 1_000_000_000_000
  vi.setSystemTime(now)
  const resendAvailableAt = now + 600_000

  const { result } = renderHook(() => useCountdown(resendAvailableAt))

  expect(result.current.remaining).toBe(600)
  expect(result.current.mmss).toBe('10:00')
})

test('edge S1 — seconds pad to two digits', () => {
  const now = 1_000_000_000_000
  vi.setSystemTime(now)
  const resendAvailableAt = now + 65_000

  const { result } = renderHook(() => useCountdown(resendAvailableAt))

  expect(result.current.mmss).toBe('1:05')
})

test('edge S1 — changing resendAvailableAt resets the countdown', () => {
  const now = 1_000_000_000_000
  vi.setSystemTime(now)

  let target = now + 60_000
  const { result, rerender } = renderHook(() => useCountdown(target))
  expect(result.current.remaining).toBe(60)

  // Update to a 2-minute cooldown (simulates server returning new resendAvailableAt after resend)
  target = now + 120_000
  rerender()

  expect(result.current.remaining).toBe(120)
})

test('edge S1 — interval stops ticking after reaching 0', () => {
  const now = 1_000_000_000_000
  vi.setSystemTime(now)
  const resendAvailableAt = now + 1_000

  const { result } = renderHook(() => useCountdown(resendAvailableAt))
  expect(result.current.remaining).toBe(1)

  act(() => vi.advanceTimersByTime(1000))
  expect(result.current.remaining).toBe(0)

  // Advancing further should not change the value (interval was cleared)
  act(() => vi.advanceTimersByTime(5000))
  expect(result.current.remaining).toBe(0)
})
