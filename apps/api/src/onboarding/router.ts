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

const isLocked = (lockedUntil: number | null, now: number) =>
  lockedUntil !== null && lockedUntil > now

const isCoolingDown = (resendAvailableAt: number | null, now: number) =>
  resendAvailableAt !== null && resendAvailableAt > now

export const otpRouter = router({
  send: publicProcedure
    .input(parseSendInput)
    .mutation(({ input: { phone } }) => {
      const now = Date.now()
      const session = getSession(phone)

      if (isLocked(session.lockedUntil, now)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Number is locked' })
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
      const session = getSession(phone)
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
      const session = getSession(phone)

      if (isLocked(session.lockedUntil, now)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Number is locked' })
      }
      if (session.verifyUsed) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Attempt used up, request a new code',
        })
      }

      const next = recordVerify(phone, code)
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
      const session = getSession(resident.phone)

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
