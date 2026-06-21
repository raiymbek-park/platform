import type { BlockId } from './apartment-ranges'

import { isApartmentInBlock } from './apartment-ranges'
import { phoneDigits } from './phone'

export type Role = 'owner' | 'tenant'

export const validateName = (value: string) => {
  const trimmed = value.trim()
  if (trimmed.length < 2) return 'Имя должно быть не короче 2 символов'
  if (trimmed.length > 60) return 'Имя должно быть не длиннее 60 символов'
  return undefined
}

export const validatePhone = (value: string) => {
  if (phoneDigits(value).length !== 10) return 'Введите 10 цифр номера'
  return undefined
}

export const validateBlock = (value: BlockId | null) => {
  if (value === null) return 'Выберите блок'
  return undefined
}

export const validateApartment = (value: string, block: BlockId | null) => {
  if (block === null) return 'Сначала выберите блок'
  if (!/^\d+$/.test(value)) return 'Введите номер квартиры'
  if (!isApartmentInBlock(block, Number(value))) {
    return 'Квартира вне диапазона выбранного блока'
  }
  return undefined
}

export const validateRole = (value: Role | null) => {
  if (value === null) return 'Выберите роль'
  return undefined
}
