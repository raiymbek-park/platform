import { t } from '@lingui/core/macro'
import {
  nameSchema,
  optionalPhoneSchema,
  phoneSchema,
  roles,
} from '@raiymbek-park/shared/validation-schemas'
import { z } from 'zod'

import { apartmentMessage, nullableBlockField } from '@/entities/resident'

export type { Role } from '@raiymbek-park/shared/validation-schemas'

const registrationSchemaWith = (phone: z.ZodString) =>
  z
    .object({
      name: nameSchema,
      phone,
      block: nullableBlockField,
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
