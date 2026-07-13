import { defineSecret } from 'firebase-functions/params'

export const smscLogin = defineSecret('SMSC_LOGIN')
export const smscPassword = defineSecret('SMSC_PASSWORD')
