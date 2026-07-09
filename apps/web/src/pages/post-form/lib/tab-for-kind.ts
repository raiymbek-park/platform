import type {
  PostKind,
  PostTab,
} from '@raiymbek-park/shared/validation-schemas'

export const tabForKind = (kind: PostKind): PostTab =>
  kind === 'offer' ? 'offers' : 'announcements'
