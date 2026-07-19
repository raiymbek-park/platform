import {
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js'
import { z } from 'zod'

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

const NAME_MIN = 2
const NAME_MAX = 60

export const CARS_MAX = 3

export const PLATE_MIN = 5
export const PLATE_MAX = 10

export const normalizePlate = (value: string) =>
  value.replace(/\s/g, '').toUpperCase()

export const plateSchema = z
  .string()
  .transform(normalizePlate)
  .refine(
    v => v.length >= PLATE_MIN && v.length <= PLATE_MAX,
    'Номер должен содержать от 5 до 10 символов',
  )
  .refine(
    v => /^[A-Z0-9]+$/.test(v),
    'Номер может содержать только латинские буквы и цифры',
  )
  .refine(v => /[A-Z]/.test(v), 'Номер должен содержать хотя бы одну букву')
  .refine(v => /[0-9]/.test(v), 'Номер должен содержать хотя бы одну цифру')

// Parse against the Kazakhstan default so a local 8-trunk prefix or a bare number
// resolves to +7; an explicit country code (+1, +44, …) is respected as dialed.
export const normalizePhone = (value: string) =>
  parsePhoneNumberFromString(value, 'KZ')?.number ??
  `+${value.replace(/\D/g, '')}`

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
  .refine(v => isValidPhoneNumber(v, 'KZ'), 'Введите корректный номер')

export const optionalPhoneSchema = z
  .string()
  .refine(
    v => v.trim() === '' || isValidPhoneNumber(v, 'KZ'),
    'Введите корректный номер',
  )

export const reliableCarrierPrefixes = ['701', '702', '775', '778'] as const

export const hasReliableCarrierPrefix = (value: string) => {
  const parsed = parsePhoneNumberFromString(value, 'KZ')
  if (!parsed?.isValid()) return true
  if (parsed.country !== 'KZ') return false
  return reliableCarrierPrefixes.some(prefix =>
    parsed.nationalNumber.startsWith(prefix),
  )
}

export const APARTMENT_RANGE_MESSAGE = 'Квартира вне диапазона выбранного блока'

const phone = optionalPhoneSchema.transform(v =>
  v.trim() === '' ? '' : normalizePhone(v),
)

const residentCoreFields = {
  apartment: z.coerce
    .number()
    .int()
    .positive('Номер квартиры должен быть положительным'),
  block: z.coerce
    .number()
    .refine(v => parseBlockId(v) !== null, 'Неизвестный блок'),
  name: nameSchema,
  role: z.enum(roles),
}

const isApartmentInSelectedBlock = (value: {
  apartment: number
  block: number
}) => {
  const block = parseBlockId(value.block)
  return block !== null && isApartmentInBlock(block, value.apartment)
}

const apartmentRangeError = {
  message: APARTMENT_RANGE_MESSAGE,
  path: ['apartment'],
}

export const registerInputSchema = z
  .object({ ...residentCoreFields, phone })
  .refine(isApartmentInSelectedBlock, apartmentRangeError)

export type RegisterInput = z.infer<typeof registerInputSchema>

export const CARS_DUPLICATE_MESSAGE = 'Номера машин не должны повторяться'

export const profileUpdateSchema = z
  .object({
    ...residentCoreFields,
    avatarUrl: z.string().nullable(),
    cars: z
      .array(plateSchema)
      .max(CARS_MAX, 'Можно добавить не более 3 номеров'),
    isPhoneVisible: z.boolean(),
  })
  .refine(isApartmentInSelectedBlock, apartmentRangeError)
  .refine(value => new Set(value.cars).size === value.cars.length, {
    message: CARS_DUPLICATE_MESSAGE,
    path: ['cars'],
  })

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
