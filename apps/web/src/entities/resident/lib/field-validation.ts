import type { BlockId } from '@raiymbek-park/shared/validation-schemas'

import { t } from '@lingui/core/macro'
import { isApartmentInBlock } from '@raiymbek-park/shared/validation-schemas'
import { z } from 'zod'

export const apartmentMessage = (block: BlockId | null, apartment: number) => {
  if (block === null) return t`Сначала выберите блок`
  if (Number.isNaN(apartment)) return t`Введите номер квартиры`
  if (!isApartmentInBlock(block, apartment)) {
    return t`Квартира вне диапазона выбранного блока`
  }
  return undefined
}

export const nullableBlockField = z
  .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
  .nullable()
  .refine(v => v !== null, { error: () => t`Выберите блок` })
