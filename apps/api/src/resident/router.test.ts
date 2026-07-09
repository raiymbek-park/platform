import type {
  ProfileUpdate,
  registerInputSchema,
} from '@raiymbek-park/shared/validation-schemas'
import type { z } from 'zod'

import { describe, expect, it, vi } from 'vitest'

import { getResident, updateResident } from './resident-store'
import { residentRouter } from './router'

vi.mock('./resident-store', () => ({
  createResident: vi.fn(),
  getResident: vi.fn(),
  markVisit: vi.fn(),
  updateResident: vi.fn(),
}))

const mockGetResident = vi.mocked(getResident)
const mockUpdateResident = vi.mocked(updateResident)

const validInput: z.input<typeof registerInputSchema> = {
  apartment: 42,
  block: 1,
  name: 'Иван Петров',
  phone: '+77071234567',
  role: 'owner',
}

const validUpdate: ProfileUpdate = {
  apartment: 42,
  avatarUrl: null,
  block: 1,
  cars: [],
  isPhoneVisible: true,
  name: 'Иван Петров',
  role: 'owner',
}

const caller = residentRouter.createCaller({
  locale: 'ru',
  phone: '+77071234567',
  uid: 'uid-1',
})

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

  it('update rejects with UNAUTHORIZED when ctx.uid is null', async () => {
    const anonymousCaller = residentRouter.createCaller({
      locale: 'ru',
      phone: null,
      uid: null,
    })
    await expect(anonymousCaller.update(validUpdate)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })
})

describe('residentRouter.update — profile update', () => {
  it('writes the submitted role when the stored role is a residency role (owner/tenant)', async () => {
    mockGetResident.mockResolvedValueOnce({
      apartment: 1,
      avatarUrl: null,
      block: 1,
      cars: [],
      isPhoneVisible: false,
      name: 'Иван Петров',
      phone: '+77071234567',
      role: 'owner',
    })

    await caller.update({ ...validUpdate, role: 'tenant' })

    expect(mockUpdateResident).toHaveBeenCalledWith(
      'uid-1',
      expect.objectContaining({ role: 'tenant' }),
    )
  })

  it('preserves a stored non-residency role (manager) instead of the submitted role', async () => {
    mockGetResident.mockResolvedValueOnce({
      apartment: 1,
      avatarUrl: null,
      block: 1,
      cars: [],
      isPhoneVisible: false,
      name: 'Иван Петров',
      phone: '+77071234567',
      role: 'manager',
    })

    await caller.update({ ...validUpdate, role: 'tenant' })

    expect(mockUpdateResident).toHaveBeenCalledWith(
      'uid-1',
      expect.objectContaining({ role: 'manager' }),
    )
  })

  it('preserves a stored non-residency role (administration) instead of the submitted role', async () => {
    mockGetResident.mockResolvedValueOnce({
      apartment: 1,
      avatarUrl: null,
      block: 1,
      cars: [],
      isPhoneVisible: false,
      name: 'Иван Петров',
      phone: '+77071234567',
      role: 'administration',
    })

    await caller.update({ ...validUpdate, role: 'owner' })

    expect(mockUpdateResident).toHaveBeenCalledWith(
      'uid-1',
      expect.objectContaining({ role: 'administration' }),
    )
  })

  it('writes the submitted role for a resident with no existing stored document', async () => {
    mockGetResident.mockResolvedValueOnce(null)

    await caller.update({ ...validUpdate, role: 'tenant' })

    expect(mockUpdateResident).toHaveBeenCalledWith(
      'uid-1',
      expect.objectContaining({ role: 'tenant' }),
    )
  })

  it('never writes a phone field — the update input carries no phone', async () => {
    mockGetResident.mockResolvedValueOnce({
      apartment: 1,
      avatarUrl: null,
      block: 1,
      cars: [],
      isPhoneVisible: false,
      name: 'Иван Петров',
      phone: '+77071234567',
      role: 'owner',
    })

    await caller.update(validUpdate)

    const [, written] = mockUpdateResident.mock.calls.at(-1) ?? []
    expect(written).not.toHaveProperty('phone')
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
      avatarUrl: null,
      block: 0,
      cars: [],
      id: null,
      isPhoneVisible: false,
      name: '',
      phone: '',
      role: 'resident',
    })
  })

  it('returns the own profile including the phone for an existing resident', async () => {
    mockGetResident.mockResolvedValueOnce({
      apartment: 42,
      avatarUrl: null,
      block: 1,
      cars: [],
      isPhoneVisible: false,
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
      avatarUrl: null,
      block: 1,
      cars: [],
      id: 'uid-1',
      isPhoneVisible: false,
      name: 'Иван Петров',
      phone: '+77071234567',
      role: 'owner',
    })
  })
})
