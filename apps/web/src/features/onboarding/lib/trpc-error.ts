// Classifies on TRPCClientError.data.code — the errorFormatter localizes
// `.message`, so string-matching it would be locale-fragile.
export const trpcErrorCode = (error: unknown): string | undefined => {
  if (typeof error !== 'object' || error === null || !('data' in error)) {
    return undefined
  }
  const { data } = error
  if (typeof data !== 'object' || data === null || !('code' in data)) {
    return undefined
  }
  const { code } = data
  return typeof code === 'string' ? code : undefined
}
