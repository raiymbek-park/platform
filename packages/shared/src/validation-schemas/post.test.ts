import { describe, expect, test } from 'vitest'

import { creatablePostKinds } from './post'

describe('creatablePostKinds — validation 8: create-kind gating by role', () => {
  test('a Resident may create only an offer', () => {
    expect(creatablePostKinds('resident')).toEqual(['offer'])
  })

  test('an Owner may create only an offer', () => {
    expect(creatablePostKinds('owner')).toEqual(['offer'])
  })

  test('a Manager may create only an announcement', () => {
    expect(creatablePostKinds('manager')).toEqual(['announcement'])
  })

  test('Administration may create either kind, offer listed first', () => {
    expect(creatablePostKinds('administration')).toEqual([
      'offer',
      'announcement',
    ])
  })

  test('a Viewer may create neither kind', () => {
    expect(creatablePostKinds('viewer')).toEqual([])
  })
})
