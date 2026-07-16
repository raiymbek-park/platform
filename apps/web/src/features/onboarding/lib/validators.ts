import type { BlockId } from '@raiymbek-park/shared/validation-schemas'

import { t } from '@lingui/core/macro'
import {
  isApartmentInBlock,
  nameSchema,
  optionalPhoneSchema,
  phoneSchema,
  roles,
} from '@raiymbek-park/shared/validation-schemas'
import { z } from 'zod'

export type { Role } from '@raiymbek-park/shared/validation-schemas'

const apartmentMessage = (block: BlockId | null, apartment: number) => {
  if (block === null) return t`Сначала выберите блок`
  if (Number.isNaN(apartment)) return t`Введите номер квартиры`
  if (!isApartmentInBlock(block, apartment)) {
    return t`Квартира вне диапазона выбранного блока`
  }
  return undefined
}

const registrationSchemaWith = (phone: z.ZodString) =>
  z
    .object({
      name: nameSchema,
      phone,
      block: z
        .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
        .nullable()
        .refine(v => v !== null, { error: () => t`Выберите блок` }),
      apartment: z.number().or(z.nan()),
      role: z
        .enum(roles)
        .nullable()
        .refine(v => v !== null, { error: () => t`Выберите роль` }),
    })
    .superRefine((value, ctx) => {
      const message = apartmentMessage(value.block, value.apartment)
      if (!message) return
      ctx.addIssue({ code: 'custom', message, path: ['apartment'] })
    })

export const smsRegistrationSchema = registrationSchemaWith(phoneSchema)

export const socialRegistrationSchema =
  registrationSchemaWith(optionalPhoneSchema)

export type RegistrationValues = z.input<typeof smsRegistrationSchema>
