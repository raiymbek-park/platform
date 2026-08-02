import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { startServer } from './server'

const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env')
if (existsSync(envPath)) process.loadEnvFile(envPath)

startServer(Number(process.env.PORT ?? 3001))
