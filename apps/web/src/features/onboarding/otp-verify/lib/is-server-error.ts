const hasCode = (value: unknown): value is { code: unknown } =>
  typeof value === 'object' && value !== null && 'code' in value

const hasData = (value: unknown): value is { data: unknown } =>
  typeof value === 'object' && value !== null && 'data' in value

export const isServerError = (error: unknown) =>
  hasData(error) && hasCode(error.data) && error.data.code !== null
