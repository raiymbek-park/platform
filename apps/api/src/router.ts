import { commentsRouter } from './comments/router'
import { eventsRouter } from './events/router'
import { issuesRouter } from './issues/router'
import { postsRouter } from './posts/router'
import { residentRouter } from './resident/router'
import { serviceContactsRouter } from './service-contacts/router'
import { publicProcedure, router } from './trpc'

export type {
  Comment,
  CommentAuthor,
  CommentTranslation,
} from './comments/comments-store'
export type { Context } from './context'
export type { Event } from './events/events-store'
export type { Locale } from './i18n'
export type { Issue, IssueAuthor } from './issues/issues-store'
export type { Post, PostAuthor } from './posts/posts-store'
export type { ResidentProfile } from './resident/router'
export type { ServiceContact } from './service-contacts/service-contacts-store'

export { createContext } from './context'
export { buildKeywords as buildIssueKeywords } from './issues/keywords'
export { buildPostKeywords } from './posts/keywords'
export { translateDocumentFields } from './translation/translate-document-fields'
export { translateDocument } from './translation/translation-client'

export const appRouter = router({
  comments: commentsRouter,
  events: eventsRouter,
  issues: issuesRouter,
  posts: postsRouter,
  resident: residentRouter,
  serviceContacts: serviceContactsRouter,
  welcome: publicProcedure.query(() => ({
    message: 'Добро пожаловать в Raiymbek Park',
  })),
})

export type AppRouter = typeof appRouter
