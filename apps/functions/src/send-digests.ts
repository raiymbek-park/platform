import { sendDigests } from '@raiymbek-park/api'
import { logger } from 'firebase-functions'
import { onSchedule } from 'firebase-functions/v2/scheduler'

export const sendDigestsHourly = onSchedule(
  { region: 'europe-west1', schedule: '0 * * * *', timeZone: 'Asia/Almaty' },
  async () => {
    try {
      await sendDigests()
    } catch (error) {
      logger.error('digest run failed', { error })
    }
  },
)
