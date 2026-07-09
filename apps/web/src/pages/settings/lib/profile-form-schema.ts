import type { ResidentProfile } from '@raiymbek-park/api'
import type {
  BlockId,
  PermissionRole,
  Role,
} from '@raiymbek-park/shared/validation-schemas'

import { t } from '@lingui/core/macro'
import {
  blockIds,
  CARS_MAX,
  isApartmentInBlock,
  nameSchema,
  normalizePlate,
  roles,
} from '@raiymbek-park/shared/validation-schemas'
import { z } from 'zod'

const PLATE_MIN = 5
const PLATE_MAX = 10

export type ProfileFormValues = {
  apartment: number
  block: BlockId | null
  cars: string[]
  isPhoneVisible: boolean
  name: string
  role: Role
}

const blockFromProfile = (block: number): BlockId | null =>
  blockIds.find(id => id === block) ?? null

const roleFromProfile = (role: PermissionRole): Role =>
  role === 'owner' ? 'owner' : 'tenant'

export const toFormValues = (profile: ResidentProfile): ProfileFormValues => ({
  apartment: profile.apartment > 0 ? profile.apartment : Number.NaN,
  block: blockFromProfile(profile.block),
  cars: profile.cars.length > 0 ? profile.cars : [''],
  isPhoneVisible: profile.isPhoneVisible,
  name: profile.name,
  role: roleFromProfile(profile.role),
})

const apartmentMessage = (block: BlockId | null, apartment: number) => {
  if (block === null) return t`Сначала выберите блок`
  if (Number.isNaN(apartment)) return t`Введите номер квартиры`
  if (!isApartmentInBlock(block, apartment)) {
    return t`Квартира вне диапазона выбранного блока`
  }
  return undefined
}

const plateMessage = (raw: string) => {
  const plate = normalizePlate(raw)
  if (plate.length < PLATE_MIN || plate.length > PLATE_MAX) {
    return t`Номер должен содержать от 5 до 10 символов`
  }
  if (!/^[A-Z0-9]+$/.test(plate)) {
    return t`Номер может содержать только латинские буквы и цифры`
  }
  if (!/[A-Z]/.test(plate)) return t`Номер должен содержать хотя бы одну букву`
  if (!/[0-9]/.test(plate)) return t`Номер должен содержать хотя бы одну цифру`
  return undefined
}

export const profileFormSchema = z
  .object({
    apartment: z.number().or(z.nan()),
    block: z
      .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
      .nullable()
      .refine(v => v !== null, { error: () => t`Выберите блок` }),
    cars: z.array(z.string()),
    isPhoneVisible: z.boolean(),
    name: nameSchema,
    role: z.enum(roles),
  })
  .superRefine((value, ctx) => {
    const message = apartmentMessage(value.block, value.apartment)
    if (message) ctx.addIssue({ code: 'custom', message, path: ['apartment'] })

    value.cars.forEach((raw, index) => {
      if (normalizePlate(raw) === '') return
      const plateError = plateMessage(raw)
      if (plateError) {
        ctx.addIssue({
          code: 'custom',
          message: plateError,
          path: ['cars', index],
        })
      }
    })

    const plates = value.cars.map(normalizePlate).filter(Boolean)
    if (plates.length > CARS_MAX) {
      ctx.addIssue({
        code: 'custom',
        message: t`Можно добавить не более 3 номеров`,
        path: ['cars'],
      })
    }
    if (new Set(plates).size !== plates.length) {
      ctx.addIssue({
        code: 'custom',
        message: t`Номера машин не должны повторяться`,
        path: ['cars'],
      })
    }
  })
