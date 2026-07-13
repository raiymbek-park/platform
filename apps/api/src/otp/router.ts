import {
  normalizePhone,
  phoneSchema,
} from '@raiymbek-park/shared/validation-schemas'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { getAuthAdmin } from '../firestore'
import { publicProcedure, router } from '../trpc'
import { generateCode, hashCode, isCodeMatch, newSalt } from './generate-code'
import { deleteOtp, getOtp, saveAttemptCount, upsertOtp } from './otp-store'
import { sendSms } from './smsc-client'
import { testCodeFor } from './test-codes'

const SEND_INTERVAL_MS = 60 * 1000
const SEND_WINDOW_MS = 60 * 60 * 1000
const SENDS_PER_WINDOW = 5
const CODE_TTL_MS = 5 * 60 * 1000
const MAX_VERIFY_ATTEMPTS = 5

const phone = phoneSchema.transform(normalizePhone)

const tooManyRequests = () =>
  new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'tooManyRequests' })

const invalidCode = () =>
  new TRPCError({ code: 'BAD_REQUEST', message: 'invalidCode' })

const smsSendFailed = () =>
  new TRPCError({ code: 'BAD_GATEWAY', message: 'smsSendFailed' })

const deliverSms = async (to: string, code: string): Promise<void> => {
  const { SMSC_LOGIN, SMSC_PASSWORD, SMSC_SENDER } = process.env
  if (!SMSC_LOGIN || !SMSC_PASSWORD) throw smsSendFailed()
  const result = await sendSms({
    login: SMSC_LOGIN,
    message: `Raiymbek Park: код подтверждения ${code}`,
    phone: to,
    psw: SMSC_PASSWORD,
    sender: SMSC_SENDER ?? '',
  }).catch(() => null)
  if (result === null || !result.ok) throw smsSendFailed()
}

const getOrCreateUid = async (phoneNumber: string): Promise<string> => {
  const auth = getAuthAdmin()
  const existing = await auth
    .getUserByPhoneNumber(phoneNumber)
    .catch(() => null)
  if (existing) return existing.uid
  const created = await auth.createUser({ phoneNumber })
  return created.uid
}

export const otpRouter = router({
  send: publicProcedure
    .input(z.object({ phone }))
    .mutation(async ({ input }) => {
      const now = Date.now()
      const existing = await getOtp(input.phone)

      if (existing && now - existing.lastSentAt < SEND_INTERVAL_MS) {
        throw tooManyRequests()
      }
      const isWindowActive =
        existing !== null && now - existing.windowStart < SEND_WINDOW_MS
      const sendCount = isWindowActive ? existing.sendCount : 0
      const windowStart = isWindowActive ? existing.windowStart : now
      if (sendCount >= SENDS_PER_WINDOW) throw tooManyRequests()

      const testCode = testCodeFor(input.phone)
      const code = testCode ?? generateCode()
      const salt = newSalt()
      await upsertOtp(input.phone, {
        attemptCount: 0,
        codeHash: hashCode(salt, code),
        createdAt: now,
        expiresAt: now + CODE_TTL_MS,
        lastSentAt: now,
        salt,
        sendCount: sendCount + 1,
        windowStart,
      })

      if (testCode === null) await deliverSms(input.phone, code)
      return { ok: true }
    }),
  verify: publicProcedure
    .input(z.object({ code: z.string().regex(/^\d{6}$/), phone }))
    .mutation(async ({ input }) => {
      const record = await getOtp(input.phone)
      if (!record || Date.now() > record.expiresAt) throw invalidCode()

      if (record.attemptCount >= MAX_VERIFY_ATTEMPTS) {
        await deleteOtp(input.phone)
        throw invalidCode()
      }
      if (!isCodeMatch(record.salt, record.codeHash, input.code)) {
        const attemptCount = record.attemptCount + 1
        if (attemptCount >= MAX_VERIFY_ATTEMPTS) await deleteOtp(input.phone)
        else await saveAttemptCount(input.phone, attemptCount)
        throw invalidCode()
      }

      const uid = await getOrCreateUid(input.phone)
      const token = await getAuthAdmin().createCustomToken(uid)
      await deleteOtp(input.phone)
      return { token }
    }),
})
