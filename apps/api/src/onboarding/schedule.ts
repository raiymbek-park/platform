const cooldownsBySend = [60, 120, 300, 600]

export const lockDurationSeconds = 86400

export const accessTokenLifetimeSeconds = 3600

export const refreshTokenLifetimeSeconds = 2592000

export const maxSends = cooldownsBySend.length

export const cooldownFor = (sendCount: number) => {
  const index = Math.min(Math.max(sendCount, 1), cooldownsBySend.length) - 1
  return cooldownsBySend[index] ?? 600
}
