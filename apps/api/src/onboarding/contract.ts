import { z } from 'zod'

// ── Shared domain rules (single source of truth, client + server) ──

export const blockIds = [1, 2, 3, 4] as const

export type BlockId = (typeof blockIds)[number]

const apartmentRanges: Record<BlockId, [number, number]> = {
  1: [1, 70],
  2: [71, 139],
  3: [1, 63],
  4: [64, 126],
}

export const blockFloors: Record<BlockId, number> = {
  1: 10,
  2: 10,
  3: 9,
  4: 9,
}

export const isApartmentInBlock = (block: BlockId, apartment: number) => {
  const [min, max] = apartmentRanges[block]
  return apartment >= min && apartment <= max
}

const parseBlockId = (value: number): BlockId | null =>
  blockIds.find(id => id === value) ?? null

export const roles = ['owner', 'tenant'] as const

export type Role = (typeof roles)[number]

export const OTP_CODE_LENGTH = 4

const otpCodePattern = new RegExp(`^\\d{${OTP_CODE_LENGTH}}$`)

const NAME_MIN = 2
const NAME_MAX = 60

// Extracts the 10 local digits, dropping a single leading 7/8 country/trunk digit.
export const phoneDigits = (value: string) => {
  const digits = value.replace(/\D/g, '')
  const local =
    digits.startsWith('7') || digits.startsWith('8') ? digits.slice(1) : digits
  return local.slice(0, 10)
}

export const normalizePhone = (value: string) => `+7${phoneDigits(value)}`

// ── Reusable field rules (shared by the client form and the server) ──

export const nameSchema = z
  .string()
  .refine(
    v => v.trim().length >= NAME_MIN,
    'Имя должно быть не короче 2 символов',
  )
  .refine(
    v => v.trim().length <= NAME_MAX,
    'Имя должно быть не длиннее 60 символов',
  )

export const phoneSchema = z
  .string()
  .refine(v => phoneDigits(v).length === 10, 'Введите 10 цифр номера')

export const APARTMENT_RANGE_MESSAGE = 'Квартира вне диапазона выбранного блока'

// ── tRPC input schemas (wire/domain shape) ──

// Server inputs additionally normalize the phone to +7XXXXXXXXXX.
const phone = phoneSchema.transform(normalizePhone)

export const sendInputSchema = z.object({ phone })

export const statusInputSchema = z.object({ phone })

export const verifyInputSchema = z.object({
  code: z
    .string()
    .regex(otpCodePattern, `Код должен состоять из ${OTP_CODE_LENGTH} цифр`),
  phone,
})

export const refreshInputSchema = z.object({
  refreshToken: z.string().min(1, 'Отсутствует refreshToken'),
})

export const registerInputSchema = z
  .object({
    apartment: z.coerce
      .number()
      .int()
      .positive('Номер квартиры должен быть положительным'),
    block: z.coerce
      .number()
      .refine(v => parseBlockId(v) !== null, 'Неизвестный блок'),
    name: nameSchema,
    phone,
    role: z.enum(roles),
  })
  .refine(
    value => {
      const block = parseBlockId(value.block)
      return block !== null && isApartmentInBlock(block, value.apartment)
    },
    {
      message: APARTMENT_RANGE_MESSAGE,
      path: ['apartment'],
    },
  )

export type RegisterInput = z.infer<typeof registerInputSchema>
