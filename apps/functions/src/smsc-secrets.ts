import { defineSecret } from 'firebase-functions/params'

export const smscLogin = defineSecret('SMSC_LOGIN')
export const smscPassword = defineSecret('SMSC_PASSWORD')
export const smscSender = defineSecret('SMSC_SENDER')
