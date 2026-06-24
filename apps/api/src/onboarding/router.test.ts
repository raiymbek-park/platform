import type { z } from 'zod'
import type { registerInputSchema } from './contract'

import { describe, expect, it } from 'vitest'

import { residentRouter } from './router'

const validInput: z.input<typeof registerInputSchema> = {
  apartment: 42,
  block: 1,
  name: 'Иван Петров',
  phone: '+77071234567',
  role: 'owner',
}

describe('residentRouter — Firebase identity gate', () => {
  it('register rejects with UNAUTHORIZED when ctx.uid is null', async () => {
    const caller = residentRouter.createCaller({ phone: null, uid: null })
    await expect(caller.register(validInput)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('markVisit rejects with UNAUTHORIZED when ctx.uid is null', async () => {
    const caller = residentRouter.createCaller({ phone: null, uid: null })
    await expect(caller.markVisit()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })
})
