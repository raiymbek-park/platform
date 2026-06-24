import { readFileSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

// Public, well-known OAuth client baked into firebase-tools — the same one the
// Firebase CLI uses for `firebase login`. Pairing it with the user's stored
// refresh token produces an `authorized_user` ADC file, letting the Admin SDK
// (and Firestore) authenticate locally with no service-account key and no gcloud.
// Firestore only accepts a cert or file-based ADC, so this writes a temp ADC file
// and points GOOGLE_APPLICATION_CREDENTIALS at it rather than building a credential.
const cliClientId =
  '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const cliClientSecret = 'j9iVZfS8kkCEFUPaAeJV0sAi'

const ancestors = (dir: string): string[] => {
  const parent = dirname(dir)
  return parent === dir ? [dir] : [dir, ...ancestors(parent)]
}

const readDefaultProject = (dir: string): string | undefined => {
  try {
    const rc = JSON.parse(readFileSync(join(dir, '.firebaserc'), 'utf8'))
    return typeof rc?.projects?.default === 'string'
      ? rc.projects.default
      : undefined
  } catch {
    return undefined
  }
}

const localProjectId = (): string | undefined =>
  process.env.GOOGLE_CLOUD_PROJECT ??
  ancestors(process.cwd()).map(readDefaultProject).find(Boolean)

const readCliRefreshToken = (): string | undefined => {
  try {
    const path = join(
      homedir(),
      '.config',
      'configstore',
      'firebase-tools.json',
    )
    const cli = JSON.parse(readFileSync(path, 'utf8'))
    return typeof cli?.tokens?.refresh_token === 'string'
      ? cli.tokens.refresh_token
      : undefined
  } catch {
    return undefined
  }
}

export const ensureLocalDevCredentials = (): void => {
  const skip =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS) ||
    Boolean(process.env.FIRESTORE_EMULATOR_HOST)
  if (skip) return

  const token = readCliRefreshToken()
  if (!token) return

  const adcPath = join(tmpdir(), 'raiymbek-park-dev-adc.json')
  writeFileSync(
    adcPath,
    JSON.stringify({
      type: 'authorized_user',
      client_id: cliClientId,
      client_secret: cliClientSecret,
      refresh_token: token,
    }),
  )
  process.env.GOOGLE_APPLICATION_CREDENTIALS = adcPath

  const projectId = localProjectId()
  if (projectId && !process.env.GOOGLE_CLOUD_PROJECT) {
    process.env.GOOGLE_CLOUD_PROJECT = projectId
  }
}
