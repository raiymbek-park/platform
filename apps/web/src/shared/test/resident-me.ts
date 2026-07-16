import type { ResidentProfile } from '@raiymbek-park/api'

export const residentMe = (
  overrides: Partial<ResidentProfile> = {},
): ResidentProfile => ({
  apartment: 42,
  avatarUrl: null,
  block: 1,
  cars: [],
  id: 'resident-uid',
  isPhoneVisible: false,
  isRegistered: true,
  name: 'Алиса',
  phone: '+77071234567',
  role: 'resident',
  ...overrides,
})
