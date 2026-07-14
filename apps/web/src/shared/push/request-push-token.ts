import { getMessaging, getToken, isSupported } from 'firebase/messaging'

import { env } from '@/shared/config'
import { app } from '@/shared/firebase'

const PROMPTED_KEY = 'push-prompted'

const resolvePermission = (): Promise<NotificationPermission> => {
  if (Notification.permission !== 'default')
    return Promise.resolve(Notification.permission)
  if (localStorage.getItem(PROMPTED_KEY)) return Promise.resolve('default')
  localStorage.setItem(PROMPTED_KEY, 'true')
  return Notification.requestPermission()
}

const canDeliverPush = async (): Promise<boolean> =>
  Boolean(env.vapidKey) && (await isSupported())

const obtainDeviceToken = async (): Promise<string | null> => {
  const registration = await navigator.serviceWorker.register(
    `${import.meta.env.BASE_URL}firebase-messaging-sw.js`,
    { scope: import.meta.env.BASE_URL },
  )
  const token = await getToken(getMessaging(app), {
    serviceWorkerRegistration: registration,
    vapidKey: env.vapidKey,
  })
  return token || null
}

export const requestPushToken = async (): Promise<string | null> => {
  try {
    if (!(await canDeliverPush())) return null
    const permission = await resolvePermission()
    if (permission !== 'granted') return null
    return await obtainDeviceToken()
  } catch {
    return null
  }
}

export const getGrantedPushToken = async (): Promise<string | null> => {
  try {
    if (!(await canDeliverPush())) return null
    if (Notification.permission !== 'granted') return null
    return await obtainDeviceToken()
  } catch {
    return null
  }
}
