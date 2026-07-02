import type { registerInputSchema } from '@raiymbek-park/shared/validation-schemas'
import type { z } from 'zod'

import { describe, expect, it, vi } from 'vitest'

import { getResident } from './resident-store'
import { residentRouter } from './router'

vi.mock('./resident-store', () => ({
  createResident: vi.fn(),
  getResident: vi.fn(),
  markVisit: vi.fn(),
}))

const mockGetResident = vi.mocked(getResident)

const validInput: z.input<typeof registerInputSchema> = {
  apartment: 42,
  block: 1,
  name: 'Иван Петров',
  phone: '+77071234567',
  role: 'owner',
}

describe('residentRouter — Firebase identity gate', () => {
  it('register rejects with UNAUTHORIZED when ctx.uid is null', async () => {
    const caller = residentRouter.createCaller({
      locale: 'ru',
      phone: null,
      uid: null,
    })
    await expect(caller.register(validInput)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('markVisit rejects with UNAUTHORIZED when ctx.uid is null', async () => {
    const caller = residentRouter.createCaller({
      locale: 'ru',
      phone: null,
      uid: null,
    })
    await expect(caller.markVisit()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })
})

describe('residentRouter.me — privacy-safe profile projection', () => {
  it('returns an empty profile when ctx.uid is null', async () => {
    const caller = residentRouter.createCaller({
      locale: 'ru',
      phone: null,
      uid: null,
    })
    await expect(caller.me()).resolves.toEqual({
      apartment: 0,
      block: 0,
      name: '',
    })
  })

  it('returns only name, block, apartment for an existing resident', async () => {
    mockGetResident.mockResolvedValueOnce({
      apartment: 42,
      block: 1,
      name: 'Иван Петров',
      phone: '+77071234567',
      role: 'owner',
    })
    const caller = residentRouter.createCaller({
      locale: 'ru',
      phone: '+77071234567',
      uid: 'uid-1',
    })
    await expect(caller.me()).resolves.toEqual({
      apartment: 42,
      block: 1,
      name: 'Иван Петров',
    })
  })
})
