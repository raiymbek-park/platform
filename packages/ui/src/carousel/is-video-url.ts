const VIDEO_EXTENSIONS = new Set([
  '3gp',
  'avi',
  'm4v',
  'mkv',
  'mov',
  'mp4',
  'ogv',
  'webm',
])

export const isVideoUrl = (url: string): boolean => {
  const path = decodeURIComponent(url.split('?')[0] ?? '')
  const extension = path.split('.').pop()?.toLowerCase() ?? ''
  return VIDEO_EXTENSIONS.has(extension)
}
