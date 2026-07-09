import { expect, test } from 'vitest'

import { formatCommentTime } from './format-comment-time'

test('formats a timestamp as zero-padded hour:minute', () => {
  expect(formatCommentTime(Date.now(), 'ru-RU')).toMatch(/^\d{2}:\d{2}$/)
})

test('honors the given locale’s hour cycle instead of always using 24-hour time', () => {
  const noon = Date.UTC(2024, 0, 1, 12, 0)

  expect(formatCommentTime(noon, 'en-US')).toMatch(/\bAM\b|\bPM\b/i)
  expect(formatCommentTime(noon, 'ru-RU')).not.toMatch(/\bAM\b|\bPM\b/i)
})
