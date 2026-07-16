import type {
  ProfileUpdate,
  registerInputSchema,
} from '@raiymbek-park/shared/validation-schemas'
import type { z } from 'zod'

import { resolveRole } from '@raiymbek-park/shared/validation-schemas'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createResidentIfAbsent,
  getResident,
  updateResident,
} from './resident-store'
import { residentRouter } from './router'

vi.mock('./resident-store', () => ({
  createResidentIfAbsent: vi.fn(),
  getResident: vi.fn(),
  markVisit: vi.fn(),
  updateResident: vi.fn(),
}))

const mockCreateResidentIfAbsent = vi.mocked(createResidentIfAbsent)
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

beforeEach(() => {
  vi.clearAllMocks()
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

describe('residentRouter.register — one record per identity', () => {
  it('writes the form profile under the caller uid via an atomic create-if-absent', async () => {
    mockCreateResidentIfAbsent.mockImplementationOnce(
      async (_uid, input) => input,
    )

    await caller.register(validInput)

    expect(mockCreateResidentIfAbsent).toHaveBeenCalledWith(
      'uid-1',
      expect.objectContaining({
        avatarUrl: null,
        cars: [],
        name: 'Иван Петров',
        phone: '+77071234567',
      }),
    )
  })

  it('user-profile happy-path 11: stores the phone hidden so registration never exposes it', async () => {
    mockCreateResidentIfAbsent.mockImplementationOnce(
      async (_uid, input) => input,
    )

    await caller.register(validInput)

    expect(mockCreateResidentIfAbsent).toHaveBeenCalledWith(
      'uid-1',
      expect.objectContaining({ isPhoneVisible: false }),
    )
  })

  it('edge-cases 14: returns the stored profile a returning identity already has, unchanged', async () => {
    const existing = {
      apartment: 60,
      avatarUrl: 'https://example/avatar.webp',
      block: 3,
      cars: ['A123BC'],
      isPhoneVisible: true,
      name: 'Султан',
      phone: '+77071234567',
      role: 'administration',
    }
    mockCreateResidentIfAbsent.mockResolvedValueOnce(existing)

    await expect(caller.register(validInput)).resolves.toEqual({
      resident: existing,
    })
  })

  it('happy-path 10: a Google session — a verified uid with no phone claim — stores the form phone', async () => {
    mockCreateResidentIfAbsent.mockImplementationOnce(
      async (_uid, input) => input,
    )
    const googleCaller = residentRouter.createCaller({
      locale: 'ru',
      phone: null,
      uid: 'google-uid',
    })

    await googleCaller.register(validInput)

    expect(mockCreateResidentIfAbsent).toHaveBeenCalledWith(
      'google-uid',
      expect.objectContaining({ phone: '+77071234567', role: 'owner' }),
    )
  })

  it('prefers the token phone claim over the submitted form phone', async () => {
    mockCreateResidentIfAbsent.mockImplementationOnce(
      async (_uid, input) => input,
    )

    await caller.register({ ...validInput, phone: '+77050000000' })

    expect(mockCreateResidentIfAbsent).toHaveBeenCalledWith(
      'uid-1',
      expect.objectContaining({ phone: '+77071234567' }),
    )
  })

  it('happy-path 12: a social session stores an empty phone when the form left it blank', async () => {
    mockCreateResidentIfAbsent.mockImplementationOnce(
      async (_uid, input) => input,
    )
    const googleCaller = residentRouter.createCaller({
      locale: 'ru',
      phone: null,
      uid: 'google-uid',
    })

    await googleCaller.register({ ...validInput, phone: '' })

    expect(mockCreateResidentIfAbsent).toHaveBeenCalledWith(
      'google-uid',
      expect.objectContaining({ name: 'Иван Петров', phone: '' }),
    )
  })

  it('edge-cases 15,16: a social identity registers its own record, leaving another identity untouched', async () => {
    mockCreateResidentIfAbsent.mockImplementationOnce(
      async (_uid, input) => input,
    )
    const facebookCaller = residentRouter.createCaller({
      locale: 'ru',
      phone: null,
      uid: 'facebook-uid',
    })

    await facebookCaller.register(validInput)

    expect(mockCreateResidentIfAbsent).toHaveBeenCalledTimes(1)
    expect(mockCreateResidentIfAbsent).toHaveBeenCalledWith(
      'facebook-uid',
      expect.objectContaining({ avatarUrl: null, cars: [] }),
    )
  })

  it('edge-cases 17: a social channel grants only the role picked on the form', async () => {
    mockCreateResidentIfAbsent.mockImplementationOnce(
      async (_uid, input) => input,
    )
    const googleCaller = residentRouter.createCaller({
      locale: 'ru',
      phone: null,
      uid: 'google-uid',
    })

    await googleCaller.register({ ...validInput, role: 'tenant' })

    const [, written] = mockCreateResidentIfAbsent.mock.calls.at(-1) ?? []
    expect(written).toMatchObject({ role: 'tenant' })
    expect(resolveRole(written?.role)).toBe('resident')
  })

  it('happy-path 13: a social-session phone is stored in canonical E.164 form', async () => {
    mockCreateResidentIfAbsent.mockImplementationOnce(
      async (_uid, input) => input,
    )
    const googleCaller = residentRouter.createCaller({
      locale: 'ru',
      phone: null,
      uid: 'google-uid',
    })

    await googleCaller.register({ ...validInput, phone: '87071234567' })

    expect(mockCreateResidentIfAbsent).toHaveBeenCalledWith(
      'google-uid',
      expect.objectContaining({ phone: '+77071234567' }),
    )
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

  it('writes the submitted role when the stored role is a legacy value', async () => {
    mockGetResident.mockResolvedValueOnce({
      apartment: 1,
      avatarUrl: null,
      block: 1,
      cars: [],
      isPhoneVisible: false,
      name: 'Иван Петров',
      phone: '+77071234567',
      role: '',
    })

    await caller.update({ ...validUpdate, role: 'owner' })

    expect(mockUpdateResident).toHaveBeenCalledWith(
      'uid-1',
      expect.objectContaining({ role: 'owner' }),
    )
  })

  it('preserves a stored elevated role (manager) instead of the submitted role', async () => {
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

  it('preserves a stored elevated role (administration) instead of the submitted role', async () => {
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
      isRegistered: false,
      name: '',
      phone: '',
      role: 'resident',
    })
    expect(mockGetResident).not.toHaveBeenCalled()
  })

  it('reports a signed-in caller with no stored record as not registered', async () => {
    mockGetResident.mockResolvedValueOnce(null)

    await expect(caller.me()).resolves.toMatchObject({
      id: 'uid-1',
      isRegistered: false,
      name: '',
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
      isRegistered: true,
      name: 'Иван Петров',
      phone: '+77071234567',
      role: 'owner',
    })
  })
})
