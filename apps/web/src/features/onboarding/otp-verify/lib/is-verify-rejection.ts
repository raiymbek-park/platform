const hasCode = (value: unknown): value is { code: unknown } =>
  typeof value === 'object' && value !== null && 'code' in value

const hasData = (value: unknown): value is { data: unknown } =>
  typeof value === 'object' && value !== null && 'data' in value

// A rejected verification (wrong or already-used code) surfaces as a tRPC
// BAD_REQUEST. Other server codes (e.g. FORBIDDEN when the number is locked)
// are not "wrong code" — they fall through to the network/unknown branch.
export const isVerifyRejection = (error: unknown) =>
  hasData(error) && hasCode(error.data) && error.data.code === 'BAD_REQUEST'
