const TEST_CODES: Record<string, string> = {
  '+77052266666': '123456',
}

export const isOtpTestMode = (): boolean => process.env.OTP_TEST_MODE === 'true'

export const testCodeFor = (phone: string): string | null =>
  isOtpTestMode() ? (TEST_CODES[phone] ?? null) : null
