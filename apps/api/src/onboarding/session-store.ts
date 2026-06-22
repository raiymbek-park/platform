import {
  accessTokenLifetimeSeconds,
  cooldownFor,
  lockDurationSeconds,
  maxSends,
  refreshTokenLifetimeSeconds,
} from './schedule'

export type Resident = {
  apartment: number
  block: number
  name: string
  phone: string
  role: string
}

export type Session = {
  code: string | null
  lockedUntil: number | null
  resendAvailableAt: number | null
  refreshToken: string | null
  sendCount: number
  verified: boolean
  verifyUsed: boolean
}

type RefreshRecord = {
  active: boolean
  refreshExpiresAt: number
  resident: Resident
}

export type TokenPair = {
  accessToken: string
  accessTokenExpiresAt: number
  refreshToken: string
  refreshTokenExpiresAt: number
}

const sessions = new Map<string, Session>()

const refreshTokens = new Map<string, RefreshRecord>()

const emptySession = (): Session => ({
  code: null,
  lockedUntil: null,
  resendAvailableAt: null,
  refreshToken: null,
  sendCount: 0,
  verified: false,
  verifyUsed: false,
})

export const getSession = (phone: string, now: number): Session => {
  const session = sessions.get(phone)
  if (!session) return emptySession()
  if (session.lockedUntil !== null && session.lockedUntil <= now) {
    return emptySession()
  }
  return session
}

const saveSession = (phone: string, session: Session) => {
  sessions.set(phone, session)
  return session
}

export const recordSend = (phone: string, now: number): Session => {
  const sendCount = getSession(phone, now).sendCount + 1
  const reachesLock = sendCount >= maxSends + 1

  const session: Session = {
    code: '1234',
    lockedUntil: reachesLock ? now + lockDurationSeconds * 1000 : null,
    resendAvailableAt: now + cooldownFor(sendCount) * 1000,
    refreshToken: null,
    sendCount,
    verified: false,
    verifyUsed: false,
  }

  return saveSession(phone, session)
}

export const recordVerify = (
  phone: string,
  code: string,
  now: number,
): Session => {
  const current = getSession(phone, now)
  const verified = current.code === code

  return saveSession(phone, {
    ...current,
    verified: current.verified || verified,
    verifyUsed: true,
  })
}

const buildTokenPair = (now: number): TokenPair => ({
  accessToken: crypto.randomUUID(),
  accessTokenExpiresAt: now + accessTokenLifetimeSeconds * 1000,
  refreshToken: crypto.randomUUID(),
  refreshTokenExpiresAt: now + refreshTokenLifetimeSeconds * 1000,
})

const registerRefresh = (pair: TokenPair, resident: Resident) => {
  refreshTokens.set(pair.refreshToken, {
    active: true,
    refreshExpiresAt: pair.refreshTokenExpiresAt,
    resident,
  })
}

export const issueTokens = (resident: Resident, now: number): TokenPair => {
  const pair = buildTokenPair(now)
  registerRefresh(pair, resident)
  return pair
}

export const rotateRefresh = (
  refreshToken: string,
  now: number,
): TokenPair | null => {
  const record = refreshTokens.get(refreshToken)
  const isUsable = record?.active && record.refreshExpiresAt > now
  if (!record || !isUsable) return null

  refreshTokens.set(refreshToken, { ...record, active: false })
  const pair = buildTokenPair(now)
  registerRefresh(pair, record.resident)
  return pair
}

export const resetStore = () => {
  sessions.clear()
  refreshTokens.clear()
}
