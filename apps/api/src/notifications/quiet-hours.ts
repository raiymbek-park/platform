const almatyHour = (now: Date): number =>
  Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: 'Asia/Almaty',
    }).format(now),
  )

export const isQuietHour = (now: Date): boolean => {
  const hour = almatyHour(now)
  return hour >= 22 || hour < 8
}
