const TEST_CODE = '123456'

const MANUAL_TEST_PHONE = '+77781234455'

export const e2ePhones = {
  home: '+77010000001',
  issues: '+77010000003',
  newcomer: '+77010000004',
  posts: '+77010000005',
  profile: '+77010000006',
} as const

const TEST_CODES: Record<string, string> = Object.fromEntries(
  [MANUAL_TEST_PHONE, ...Object.values(e2ePhones)].map(phone => [
    phone,
    TEST_CODE,
  ]),
)

const isOtpTestMode = (): boolean => process.env.OTP_TEST_MODE === 'true'

export const testCodeFor = (phone: string): string | null =>
  isOtpTestMode() ? (TEST_CODES[phone] ?? null) : null
