import type { PostKind } from '@raiymbek-park/shared/validation-schemas'

export const illustrationUrl = (kind: PostKind) =>
  `${import.meta.env.BASE_URL}images/${
    kind === 'offer' ? 'create-ad.png' : 'residential-complex.png'
  }`
