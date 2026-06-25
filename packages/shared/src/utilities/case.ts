export const toKebab = (value: string) =>
  value.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)

export const toCamel = (value: string) =>
  value.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase())
