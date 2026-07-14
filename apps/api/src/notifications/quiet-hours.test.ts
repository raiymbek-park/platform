import { describe, expect, test } from 'vitest'

import { isQuietHour } from './quiet-hours'

const atAlmaty = (hour: number, minute = 0): Date =>
  new Date(Date.UTC(2026, 6, 14, hour - 5, minute))

describe('isQuietHour — 22:00–08:00 Asia/Almaty', () => {
  test('the 22:00 run is quiet', () => {
    expect(isQuietHour(atAlmaty(22))).toBe(true)
  })

  test('21:59 is not quiet', () => {
    expect(isQuietHour(atAlmaty(21, 59))).toBe(false)
  })

  test('the 08:00 run delivers', () => {
    expect(isQuietHour(atAlmaty(8))).toBe(false)
  })

  test('07:59 is quiet', () => {
    expect(isQuietHour(atAlmaty(7, 59))).toBe(true)
  })

  test('23:00 is quiet', () => {
    expect(isQuietHour(atAlmaty(23))).toBe(true)
  })

  test('midnight in Almaty (19:00 UTC) is quiet', () => {
    expect(isQuietHour(new Date('2026-07-14T19:00:00Z'))).toBe(true)
  })

  test('noon is not quiet', () => {
    expect(isQuietHour(atAlmaty(12))).toBe(false)
  })

  test('the hour is read in Asia/Almaty regardless of the run clock reading UTC', () => {
    expect(isQuietHour(new Date('2026-07-14T18:00:00Z'))).toBe(true)
    expect(isQuietHour(new Date('2026-07-14T04:00:00Z'))).toBe(false)
  })
})
