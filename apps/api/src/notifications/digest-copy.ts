import type { Event } from '../events/events-store'
import type { Locale } from '../i18n'

import {
  digestRemainder,
  issueCommentHeadline,
  issueStatusHeadline,
} from '../i18n'

const headline = (locale: Locale, event: Event): string => {
  if (event.type === 'issue-status')
    return issueStatusHeadline[locale](event.number, event.status)
  if (event.type === 'issue-comment')
    return issueCommentHeadline[locale](event.number)
  return event.title
}

export const digestBody = (locale: Locale, events: Event[]): string => {
  const [newest, ...rest] = events
  if (!newest) return ''
  const lead = headline(locale, newest)
  return rest.length
    ? `${lead} · ${digestRemainder[locale](rest.length)}`
    : lead
}
