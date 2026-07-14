const apiUrl: string = import.meta.env.VITE_API_URL ?? '/trpc'

const vapidKey: string = import.meta.env.VITE_FCM_VAPID_KEY ?? ''

export const env = {
  apiUrl,
  vapidKey,
}
