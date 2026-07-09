import type { ImageFormItem } from '@raiymbek-park/ui'

import { useLingui } from '@lingui/react/macro'
import { randomId } from '@raiymbek-park/shared'
import {
  MEDIA_MAX_BYTES,
  MEDIA_MAX_ITEMS,
} from '@raiymbek-park/shared/validation-schemas'
import { useEffect, useRef, useState } from 'react'

import { showToastMessage } from '@/shared/toast'

export type MediaItem = {
  file?: File
  id: string
  isVideo: boolean
  url: string
}

type UseMediaPickerInput = {
  initialUrls?: string[]
}

const MEDIA_MAX_MB = MEDIA_MAX_BYTES / 1024 / 1024

const VIDEO_URL = /\.(3gp|avi|mkv|mov|mp4|webm)(\?|$)/i

const toPicked = (file: File): MediaItem => ({
  file,
  id: randomId(),
  isVideo: file.type.startsWith('video'),
  url: URL.createObjectURL(file),
})

const toRemote = (url: string): MediaItem => ({
  id: url,
  isVideo: VIDEO_URL.test(url),
  url,
})

const totalBytes = (items: MediaItem[]) =>
  items.reduce((sum, item) => sum + (item.file?.size ?? 0), 0)

const revoke = (item: MediaItem) => {
  if (item.file) URL.revokeObjectURL(item.url)
}

export const useMediaPicker = ({ initialUrls }: UseMediaPickerInput = {}) => {
  const { t } = useLingui()
  const [items, setItems] = useState<MediaItem[]>(
    () => initialUrls?.map(toRemote) ?? [],
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(
    () => () => {
      itemsRef.current.forEach(revoke)
    },
    [],
  )

  const add = (fileList: FileList) => {
    const incoming = Array.from(fileList)

    if (items.length + incoming.length > MEDIA_MAX_ITEMS) {
      showToastMessage({
        kind: 'error',
        text: t`Можно прикрепить не более ${MEDIA_MAX_ITEMS} файлов`,
      })
      return
    }

    const next = [...items, ...incoming.map(toPicked)]
    if (totalBytes(next) > MEDIA_MAX_BYTES) {
      next.slice(items.length).forEach(revoke)
      showToastMessage({
        kind: 'error',
        text: t`Файл слишком большой: суммарный размер вложений не должен превышать ${MEDIA_MAX_MB} МБ`,
      })
      return
    }

    setItems(next)
    setActiveIndex(next.length - 1)
  }

  const removeCurrent = () => {
    const target = items[activeIndex]
    if (!target) return
    revoke(target)
    const next = items.filter(item => item.id !== target.id)
    setItems(next)
    setActiveIndex(index => Math.max(0, Math.min(index, next.length - 1)))
  }

  const remove = (id: string) => {
    const target = items.find(item => item.id === id)
    if (!target) return
    revoke(target)
    const next = items.filter(item => item.id !== id)
    setItems(next)
    setActiveIndex(index => Math.max(0, Math.min(index, next.length - 1)))
  }

  const reset = () => {
    items.forEach(revoke)
    setItems([])
    setActiveIndex(0)
  }

  const photos: ImageFormItem[] = items.map(({ id, isVideo, url }) => ({
    id,
    isVideo,
    url,
  }))

  return {
    activeIndex,
    add,
    files: items.flatMap(item => (item.file ? [item.file] : [])),
    items,
    photos,
    remove,
    removeCurrent,
    reset,
    select: setActiveIndex,
  }
}

export type MediaPicker = ReturnType<typeof useMediaPicker>
