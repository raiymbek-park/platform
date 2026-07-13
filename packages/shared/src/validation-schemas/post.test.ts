import { describe, expect, test } from 'vitest'

import {
  ANNOUNCEMENT_DESCRIPTION_MAX,
  creatablePostKinds,
  POST_DESCRIPTION_MAX,
  postCreateInputSchema,
} from './post'

const announcement = (description: string) => ({
  category: 'complex',
  description,
  kind: 'announcement',
  media: [],
  title: 'Заголовок',
})

const offer = (description: string) => ({
  category: 'sell',
  description,
  kind: 'offer',
  media: [],
  title: 'Заголовок',
})

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

describe('post description length limit by kind', () => {
  test('an announcement accepts a description up to 3000 characters', () => {
    const result = postCreateInputSchema.safeParse(
      announcement('a'.repeat(ANNOUNCEMENT_DESCRIPTION_MAX)),
    )
    expect(result.success).toBe(true)
  })

  test('an announcement rejects a description longer than 3000 characters', () => {
    const result = postCreateInputSchema.safeParse(
      announcement('a'.repeat(ANNOUNCEMENT_DESCRIPTION_MAX + 1)),
    )
    expect(result.success).toBe(false)
  })

  test('an offer still caps the description at 1000 characters', () => {
    expect(
      postCreateInputSchema.safeParse(offer('a'.repeat(POST_DESCRIPTION_MAX)))
        .success,
    ).toBe(true)
    expect(
      postCreateInputSchema.safeParse(
        offer('a'.repeat(POST_DESCRIPTION_MAX + 1)),
      ).success,
    ).toBe(false)
  })
})
