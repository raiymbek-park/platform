import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'

import { useClipboardCode } from './use-clipboard-code'

const stubClipboard = (text: string | null) => {
  const readText =
    text === null
      ? vi.fn().mockRejectedValue(new Error('denied'))
      : vi.fn().mockResolvedValue(text)
  Object.defineProperty(navigator, 'clipboard', {
    value: { readText },
    writable: true,
    configurable: true,
  })
  return readText
}

afterEach(() => {
  vi.restoreAllMocks()
})

// validation S7 — enabled only with 4 digits
test('validation S7 — clipboard with exactly 4 digits returns that code', async () => {
  stubClipboard('1234')

  const { result } = renderHook(() => useClipboardCode())
  await act(() => Promise.resolve())

  expect(result.current).toBe('1234')
})

test('validation S7 — clipboard with fewer than 4 digits returns null', async () => {
  stubClipboard('123')

  const { result } = renderHook(() => useClipboardCode())
  await act(() => Promise.resolve())

  expect(result.current).toBeNull()
})

test('validation S7 — clipboard with more than 4 digits returns null', async () => {
  stubClipboard('12345')

  const { result } = renderHook(() => useClipboardCode())
  await act(() => Promise.resolve())

  expect(result.current).toBeNull()
})

test('validation S7 — clipboard with non-digit characters returns null', async () => {
  stubClipboard('12a4')

  const { result } = renderHook(() => useClipboardCode())
  await act(() => Promise.resolve())

  expect(result.current).toBeNull()
})

test('validation S7 — empty clipboard returns null', async () => {
  stubClipboard('')

  const { result } = renderHook(() => useClipboardCode())
  await act(() => Promise.resolve())

  expect(result.current).toBeNull()
})

// edge S11 — clipboard unavailable/denied returns null with no error
test('edge S11 — clipboard read rejected returns null without throwing', async () => {
  stubClipboard(null)

  const { result } = renderHook(() => useClipboardCode())
  await act(() => Promise.resolve())

  expect(result.current).toBeNull()
})

test('edge S11 — clipboard API absent returns null without throwing', async () => {
  Object.defineProperty(navigator, 'clipboard', {
    value: undefined,
    writable: true,
    configurable: true,
  })

  const { result } = renderHook(() => useClipboardCode())
  await act(() => Promise.resolve())

  expect(result.current).toBeNull()
})

// validation S7 — refreshes on visibilitychange
test('validation S7 — re-reads clipboard when document visibility changes', async () => {
  const readText = vi
    .fn()
    .mockResolvedValueOnce('0000')
    .mockResolvedValueOnce('9999')
  Object.defineProperty(navigator, 'clipboard', {
    value: { readText },
    writable: true,
    configurable: true,
  })

  const { result } = renderHook(() => useClipboardCode())
  await act(() => Promise.resolve())
  expect(result.current).toBe('0000')

  await act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
    return Promise.resolve()
  })
  expect(result.current).toBe('9999')
})

// Kill: window.addEventListener('focus', ...) event name mutation
test('validation S7 — re-reads clipboard when window receives focus', async () => {
  const readText = vi
    .fn()
    .mockResolvedValueOnce('1111')
    .mockResolvedValueOnce('2222')
  Object.defineProperty(navigator, 'clipboard', {
    value: { readText },
    writable: true,
    configurable: true,
  })

  const { result } = renderHook(() => useClipboardCode())
  await act(() => Promise.resolve())
  expect(result.current).toBe('1111')

  await act(() => {
    window.dispatchEvent(new Event('focus'))
    return Promise.resolve()
  })
  expect(result.current).toBe('2222')
})
