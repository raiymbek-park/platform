import { toCamel, toKebab } from '../utilities/case'

type CssModule = Record<string, string>
type StateValue = string | boolean | undefined
type StateProps = Record<string, StateValue>

const lookup = (css: CssModule, name: string) => css[toCamel(name)]

const stateClass = (
  css: CssModule,
  rootClass: string,
  key: string,
  value: string | true,
) =>
  value === true
    ? lookup(css, `${rootClass}-${toKebab(key)}`)
    : lookup(css, `${rootClass}-${toKebab(key)}-${value}`)

const isActive = (
  entry: [string, StateValue],
): entry is [string, string | true] => {
  const value = entry[1]
  return value !== undefined && value !== false && value !== ''
}

const keyOf = (css: CssModule, value: string | undefined) =>
  Object.keys(css).find(key => css[key] === value) ?? ''

export const pickCss = (css: CssModule, rootValue: string | undefined) => {
  const rootClass = toKebab(keyOf(css, rootValue))

  return (props: StateProps = {}, ...extra: Array<string | undefined>) =>
    [
      rootValue,
      ...Object.entries(props)
        .filter(isActive)
        .map(([key, value]) => stateClass(css, rootClass, key, value)),
      ...extra,
    ]
      .filter(Boolean)
      .join(' ')
}
