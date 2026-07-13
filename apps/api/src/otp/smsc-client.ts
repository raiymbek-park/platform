const SMSC_SEND_URL = 'https://smsc.kz/sys/send.php'

export type SendSmsInput = {
  login: string
  message: string
  phone: string
  psw: string
  sender: string
}

export type SendSmsResult =
  | { ok: true; id: number }
  | { ok: false; error: string }

const parseBody = (body: unknown): SendSmsResult => {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'malformed smsc response' }
  }
  if ('error' in body) {
    const { error } = body
    return { ok: false, error: typeof error === 'string' ? error : 'unknown' }
  }
  if ('id' in body && typeof body.id === 'number') {
    return { ok: true, id: body.id }
  }
  return { ok: false, error: 'malformed smsc response' }
}

export const sendSms = async ({
  login,
  message,
  phone,
  psw,
  sender,
}: SendSmsInput): Promise<SendSmsResult> => {
  const params = new URLSearchParams({
    charset: 'utf-8',
    fmt: '3',
    login,
    mes: message,
    phones: phone,
    psw,
    ...(sender ? { sender } : {}),
  })
  const response = await fetch(SMSC_SEND_URL, {
    body: params,
    method: 'POST',
  })
  return parseBody(await response.json())
}
