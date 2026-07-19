export const toErrorMessage = (error: unknown): string | undefined => {
  if (typeof error === 'string') return error
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error
    return typeof message === 'string' ? message : undefined
  }
  return undefined
}
