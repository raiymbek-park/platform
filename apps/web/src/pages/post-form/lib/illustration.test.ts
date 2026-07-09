import { describe, expect, test } from 'vitest'

import { illustrationUrl } from './illustration'

describe('illustrationUrl — per-kind form illustration', () => {
  test('an offer form uses the create-ad illustration', () => {
    expect(illustrationUrl('offer')).toContain('create-ad.png')
  })

  test('an announcement form uses the residential-complex illustration', () => {
    expect(illustrationUrl('announcement')).toContain('residential-complex.png')
  })
})
