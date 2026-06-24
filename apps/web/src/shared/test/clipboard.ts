import { vi } from 'vitest'

export const stubClipboard = (text: string | null) => {
  const readText =
    text === null
      ? vi.fn().mockRejectedValue(new Error('denied'))
      : vi.fn().mockResolvedValue(text)
  Object.defineProperty(navigator, 'clipboard', {
    value: { readText },
    configurable: true,
    writable: true,
  })
}
