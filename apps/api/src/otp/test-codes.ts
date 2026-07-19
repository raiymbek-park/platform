const TEST_CODES: Record<string, string> = {
  '+77781234455': '123456',
}

const isOtpTestMode = (): boolean => process.env.OTP_TEST_MODE === 'true'

export const testCodeFor = (phone: string): string | null =>
  isOtpTestMode() ? (TEST_CODES[phone] ?? null) : null
