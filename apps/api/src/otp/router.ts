import type { Locale } from '../i18n'
import type { OtpRecord } from './otp-store'

import {
  normalizePhone,
  phoneSchema,
} from '@raiymbek-park/shared/validation-schemas'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { getAuthAdmin } from '../firestore'
import { otpSmsText } from '../i18n'
import { publicProcedure, router } from '../trpc'
import { generateCode, hashCode, isCodeMatch, newSalt } from './generate-code'
import { deleteOtp, reserveSend, upsertOtp, verifyAttempt } from './otp-store'
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

const deliverSms = async (
  to: string,
  code: string,
  locale: Locale,
): Promise<void> => {
  const { SMSC_LOGIN, SMSC_PASSWORD, SMSC_SENDER } = process.env
  if (!SMSC_LOGIN || !SMSC_PASSWORD) throw smsSendFailed()
  const result = await sendSms({
    login: SMSC_LOGIN,
    message: otpSmsText(locale, code),
    phone: to,
    psw: SMSC_PASSWORD,
    sender: SMSC_SENDER ?? '',
  }).catch(() => null)
  if (result === null || !result.ok) throw smsSendFailed()
}

const restoreOtp = (phoneNumber: string, previous: OtpRecord | null) =>
  previous ? upsertOtp(phoneNumber, previous) : deleteOtp(phoneNumber)

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
    .mutation(async ({ ctx, input }) => {
      const testCode = testCodeFor(input.phone)
      const code = testCode ?? generateCode()
      const salt = newSalt()
      const reserved = await reserveSend({
        codeHash: hashCode(salt, code),
        now: Date.now(),
        phone: input.phone,
        rules: {
          intervalMs: SEND_INTERVAL_MS,
          sendsPerWindow: SENDS_PER_WINDOW,
          windowMs: SEND_WINDOW_MS,
        },
        salt,
        ttlMs: CODE_TTL_MS,
      })
      if (reserved.isBlocked) throw tooManyRequests()

      if (testCode === null) {
        await deliverSms(input.phone, code, ctx.locale).catch(async error => {
          await restoreOtp(input.phone, reserved.previous)
          throw error
        })
      }
      return { ok: true }
    }),
  verify: publicProcedure
    .input(z.object({ code: z.string().regex(/^\d{6}$/), phone }))
    .mutation(async ({ input }) => {
      const outcome = await verifyAttempt({
        isMatch: record =>
          isCodeMatch(record.salt, record.codeHash, input.code),
        maxAttempts: MAX_VERIFY_ATTEMPTS,
        now: Date.now(),
        phone: input.phone,
      })
      if (outcome === 'invalid') throw invalidCode()

      const uid = await getOrCreateUid(input.phone)
      const token = await getAuthAdmin().createCustomToken(uid)
      await deleteOtp(input.phone)
      return { token }
    }),
})
