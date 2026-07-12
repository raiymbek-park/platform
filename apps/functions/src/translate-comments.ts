import { translateText, translateTextField } from '@raiymbek-park/api'
import { logger } from 'firebase-functions'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'

import { anthropicApiKey } from './anthropic-key'

const translateComments = (document: string) =>
  onDocumentWritten(
    {
      document,
      region: 'europe-west1',
      secrets: [anthropicApiKey],
    },
    async event => {
      const after = event.data?.after
      if (!after?.exists) return
      try {
        const write = await translateTextField({
          data: after.data() ?? {},
          translate: input =>
            translateText({ apiKey: anthropicApiKey.value(), ...input }),
        })
        if (write) await after.ref.update(write)
      } catch (error) {
        logger.error('comment translation failed', {
          commentId: after.id,
          error,
        })
      }
    },
  )

export const translatePostComments = translateComments(
  'posts/{postId}/comments/{commentId}',
)

export const translateIssueComments = translateComments(
  'issues/{issueId}/comments/{commentId}',
)
