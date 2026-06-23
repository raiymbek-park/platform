export const NOW = 1_700_000_000_000

export const tokenPair = (accessExpiry: number, refreshExpiry: number) => ({
  accessToken: 'access',
  accessTokenExpiresAt: accessExpiry,
  refreshToken: 'refresh',
  refreshTokenExpiresAt: refreshExpiry,
})
