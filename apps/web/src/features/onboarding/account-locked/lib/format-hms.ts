const pad = (value: number) => String(value).padStart(2, '0')

export const formatHms = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const rest = safe % 60
  return `${pad(hours)}:${pad(minutes)}:${pad(rest)}`
}
