import { beforeEach, describe, expect, it, vi } from 'vitest'

import { registerPushToken, unregisterPushToken } from './push-token-store'
import { notificationsRouter } from './router'

vi.mock('./push-token-store', () => ({
  registerPushToken: vi.fn(),
  unregisterPushToken: vi.fn(),
}))

const mockRegisterPushToken = vi.mocked(registerPushToken)
const mockUnregisterPushToken = vi.mocked(unregisterPushToken)

const caller = notificationsRouter.createCaller({
  locale: 'kk',
  phone: '+77071234567',
  uid: 'uid-1',
})

const anonymousCaller = notificationsRouter.createCaller({
  locale: 'ru',
  phone: null,
  uid: null,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('notificationsRouter — Firebase identity gate', () => {
  it('registerToken rejects with UNAUTHORIZED when ctx.uid is null', async () => {
    await expect(
      anonymousCaller.registerToken({ token: 'token-1' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(mockRegisterPushToken).not.toHaveBeenCalled()
  })

  it('unregisterToken rejects with UNAUTHORIZED when ctx.uid is null', async () => {
    await expect(
      anonymousCaller.unregisterToken({ token: 'token-1' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(mockUnregisterPushToken).not.toHaveBeenCalled()
  })
})

describe('notificationsRouter.registerToken', () => {
  it('rejects an empty token', async () => {
    await expect(caller.registerToken({ token: '' })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
    expect(mockRegisterPushToken).not.toHaveBeenCalled()
  })
})

describe('notificationsRouter.unregisterToken', () => {
  it('removes the token registration of the caller', async () => {
    await expect(caller.unregisterToken({ token: 'token-1' })).resolves.toEqual(
      { ok: true },
    )
    expect(mockUnregisterPushToken).toHaveBeenCalledWith('uid-1', 'token-1')
  })
})
