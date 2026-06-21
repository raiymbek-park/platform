import { TRPCError } from '@trpc/server'

import { publicProcedure, router } from '../trpc'
import {
  getSession,
  issueTokens,
  recordSend,
  recordVerify,
  rotateRefresh,
} from './session-store'
import {
  parseRefreshInput,
  parseRegisterInput,
  parseSendInput,
  parseStatusInput,
  parseVerifyInput,
} from './validators'

const isCoolingDown = (resendAvailableAt: number | null, now: number) =>
  resendAvailableAt !== null && resendAvailableAt > now

const secondsUntil = (timestamp: number, now: number) =>
  Math.ceil((timestamp - now) / 1000)

export const otpRouter = router({
  send: publicProcedure
    .input(parseSendInput)
    .mutation(({ input: { phone } }) => {
      const now = Date.now()
      const session = getSession(phone, now)

      if (session.lockedUntil !== null && session.lockedUntil > now) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Number is locked. ${secondsUntil(session.lockedUntil, now)}s until unlock`,
        })
      }
      if (isCoolingDown(session.resendAvailableAt, now)) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Cooldown is still active',
        })
      }

      const next = recordSend(phone, now)
      return {
        lockedUntil: next.lockedUntil,
        resendAvailableAt: next.resendAvailableAt,
        sendCount: next.sendCount,
      }
    }),

  status: publicProcedure
    .input(parseStatusInput)
    .query(({ input: { phone } }) => {
      const now = Date.now()
      const session = getSession(phone, now)
      return {
        hasActiveCode: session.code !== null,
        lockedUntil: session.lockedUntil,
        resendAvailableAt: session.resendAvailableAt,
        sendCount: session.sendCount,
        verified: session.verified,
      }
    }),

  verify: publicProcedure
    .input(parseVerifyInput)
    .mutation(({ input: { code, phone } }) => {
      const now = Date.now()
      const session = getSession(phone, now)

      if (session.lockedUntil !== null && session.lockedUntil > now) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Number is locked. ${secondsUntil(session.lockedUntil, now)}s until unlock`,
        })
      }
      if (session.verifyUsed) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Attempt used up, request a new code',
        })
      }

      const next = recordVerify(phone, code, now)
      if (!next.verified) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Wrong code' })
      }

      return { verified: true }
    }),
})

export const residentRouter = router({
  register: publicProcedure
    .input(parseRegisterInput)
    .mutation(({ input: resident }) => {
      const now = Date.now()
      const session = getSession(resident.phone, now)

      if (!session.verified) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Phone is not verified',
        })
      }

      const tokens = issueTokens(resident, now)
      return { ...tokens, resident }
    }),
})

export const authRouter = router({
  refresh: publicProcedure
    .input(parseRefreshInput)
    .mutation(({ input: { refreshToken } }) => {
      const tokens = rotateRefresh(refreshToken, Date.now())
      if (!tokens) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired refresh token',
        })
      }
      return tokens
    }),
})
