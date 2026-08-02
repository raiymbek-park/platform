import { startServer } from '../server'
import { seedE2eFixtures } from './e2e-seed'
import { injectFake } from './index'

process.env.OTP_TEST_MODE = 'true'

injectFake()
seedE2eFixtures()

startServer(Number(process.env.PORT ?? 3001))
