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

test.each([
  {
    name: 'validation S7 — clipboard with exactly 6 digits returns that code',
    clipboard: '123456',
    expected: '123456',
  },
  {
    name: 'validation S7 — clipboard with fewer than 6 digits returns null',
    clipboard: '12345',
    expected: null,
  },
  {
    name: 'validation S7 — clipboard with more than 6 digits returns null',
    clipboard: '1234567',
    expected: null,
  },
  {
    name: 'validation S7 — clipboard with non-digit characters returns null',
    clipboard: '12a456',
    expected: null,
  },
  {
    name: 'validation S7 — extracts the standalone code from a full pasted message',
    clipboard:
      'Здравствуйте, Азиза! 👋\n\nВаш код для входа в «Raiymbek Park»:\n\n123456\n\nКод действует 5 минут.',
    expected: '123456',
  },
  {
    name: 'validation S7 — empty clipboard returns null',
    clipboard: '',
    expected: null,
  },
  {
    name: 'edge S11 — clipboard read rejected returns null without throwing',
    clipboard: null,
    expected: null,
  },
])('$name', async ({ clipboard, expected }) => {
  stubClipboard(clipboard)

  const { result } = renderHook(() => useClipboardCode())
  await act(() => Promise.resolve())

  expect(result.current).toBe(expected)
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
