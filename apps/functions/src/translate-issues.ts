import {
  buildIssueKeywords,
  translateDocument,
  translateDocumentFields,
} from '@raiymbek-park/api'
import { logger } from 'firebase-functions'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'

import { anthropicApiKey } from './anthropic-key'

export const translateIssues = onDocumentWritten(
  {
    document: 'issues/{id}',
    region: 'europe-west1',
    secrets: [anthropicApiKey],
  },
  async event => {
    const after = event.data?.after
    if (!after?.exists) return
    const data = after.data() ?? {}
    const number = typeof data.number === 'number' ? data.number : 0
    try {
      const write = await translateDocumentFields({
        buildKeywords: titles => buildIssueKeywords({ number, titles }),
        data,
        translate: input =>
          translateDocument({ apiKey: anthropicApiKey.value(), ...input }),
      })
      if (write) await after.ref.update(write)
    } catch (error) {
      logger.error('issue translation failed', { error, issueId: after.id })
    }
  },
)
