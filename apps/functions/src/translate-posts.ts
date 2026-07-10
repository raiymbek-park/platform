import {
  buildPostKeywords,
  translateDocument,
  translateDocumentFields,
} from '@raiymbek-park/api'
import { logger } from 'firebase-functions'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'

import { anthropicApiKey } from './anthropic-key'

export const translatePosts = onDocumentWritten(
  {
    document: 'posts/{id}',
    region: 'europe-west1',
    secrets: [anthropicApiKey],
  },
  async event => {
    const after = event.data?.after
    if (!after?.exists) return
    try {
      const write = await translateDocumentFields({
        buildKeywords: buildPostKeywords,
        data: after.data() ?? {},
        translate: input =>
          translateDocument({ apiKey: anthropicApiKey.value(), ...input }),
      })
      if (write) await after.ref.update(write)
    } catch (error) {
      logger.error('post translation failed', { error, postId: after.id })
    }
  },
)
