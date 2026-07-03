import type { ImageFormItem } from '@raiymbek-park/ui'

import { useLingui } from '@lingui/react/macro'
import { randomId } from '@raiymbek-park/shared'
import {
  MEDIA_MAX_BYTES,
  MEDIA_MAX_ITEMS,
} from '@raiymbek-park/shared/validation-schemas'
import { useState } from 'react'

type PickedFile = {
  file: File
  id: string
  isVideo: boolean
  url: string
}

const toPicked = (file: File): PickedFile => ({
  file,
  id: randomId(),
  isVideo: file.type.startsWith('video'),
  url: URL.createObjectURL(file),
})

const totalBytes = (files: PickedFile[]) =>
  files.reduce((sum, { file }) => sum + file.size, 0)

export const useMediaPicker = () => {
  const { t } = useLingui()
  const [picked, setPicked] = useState<PickedFile[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const add = (fileList: FileList) => {
    const next = [...picked, ...Array.from(fileList).map(toPicked)]
    if (next.length > MEDIA_MAX_ITEMS) {
      setError(t`Можно прикрепить не более 10 файлов`)
      return
    }
    if (totalBytes(next) > MEDIA_MAX_BYTES) {
      setError(t`Общий размер файлов не должен превышать 200 МБ`)
      return
    }
    setError(null)
    setPicked(next)
    setActiveIndex(next.length - 1)
  }

  const removeCurrent = () => {
    const target = picked[activeIndex]
    if (!target) return
    URL.revokeObjectURL(target.url)
    const next = picked.filter(file => file.id !== target.id)
    setError(null)
    setPicked(next)
    setActiveIndex(index => Math.max(0, Math.min(index, next.length - 1)))
  }

  const photos: ImageFormItem[] = picked.map(({ id, isVideo, url }) => ({
    id,
    isVideo,
    url,
  }))

  return {
    activeIndex,
    add,
    error,
    files: picked.map(({ file }) => file),
    photos,
    removeCurrent,
    select: setActiveIndex,
  }
}
