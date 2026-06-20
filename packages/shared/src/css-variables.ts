import { toKebab } from './case'

type CssVarValue = string | number

export const cssVariables = (vars: Record<string, CssVarValue>) =>
  Object.fromEntries(
    Object.entries(vars).map(([key, value]) => [`--${toKebab(key)}`, value]),
  )
