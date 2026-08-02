import { injectFirestore } from '../firestore'
import { startServer } from '../server'
import { seedE2eFixtures } from './e2e-seed'
import { fakeFieldValue, getFirestore } from './firestore-fake'

process.env.OTP_TEST_MODE = 'true'
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099'
process.env.GOOGLE_CLOUD_PROJECT ??= 'raiymbek-park-sa99'

injectFirestore({ db: getFirestore(), fieldValue: fakeFieldValue })

await seedE2eFixtures()

startServer(Number(process.env.PORT ?? 3001))
