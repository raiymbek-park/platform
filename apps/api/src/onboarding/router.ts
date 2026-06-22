import { TRPCError } from '@trpc/server'

import { publicProcedure, router } from '../trpc'
import {
  refreshInputSchema,
  registerInputSchema,
  sendInputSchema,
  statusInputSchema,
  verifyInputSchema,
} from './contract'
import {
  getSession,
  issueTokens,
  recordSend,
  recordVerify,
  rotateRefresh,
} from './session-store'

const isCoolingDown = (resendAvailableAt: number | null, now: number) =>
  resendAvailableAt !== null && resendAvailableAt > now

const secondsUntil = (timestamp: number, now: number) =>
  Math.ceil((timestamp - now) / 1000)

export const otpRouter = router({
  send: publicProcedure
    .input(sendInputSchema)
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
    .input(statusInputSchema)
    .query(({ input: { phone } }) => {
      const now = Date.now()
      const session = getSession(phone, now)
      return {
        hasActiveCode: session.code !== null,
        lockedUntil: session.lockedUntil,
        resendAvailableAt: session.resendAvailableAt,
        sendCount: session.sendCount,
        verified: session.verified,
        verifyUsed: session.verifyUsed,
      }
    }),

  verify: publicProcedure
    .input(verifyInputSchema)
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
    .input(registerInputSchema)
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
    .input(refreshInputSchema)
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
