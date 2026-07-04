import type { ImageFormItem } from '@raiymbek-park/ui'

import { useLingui } from '@lingui/react/macro'
import { randomId } from '@raiymbek-park/shared'
import {
  MEDIA_MAX_BYTES,
  MEDIA_MAX_ITEMS,
} from '@raiymbek-park/shared/validation-schemas'
import { useState } from 'react'

import { showToastMessage } from '@/shared/toast'

type PickedFile = {
  file: File
  id: string
  isVideo: boolean
  url: string
}

const MEDIA_MAX_MB = MEDIA_MAX_BYTES / 1024 / 1024

const toPicked = (file: File): PickedFile => ({
  file,
  id: randomId(),
  isVideo: file.type.startsWith('video'),
  url: URL.createObjectURL(file),
})

const totalBytes = (files: File[]) =>
  files.reduce((sum, file) => sum + file.size, 0)

export const useMediaPicker = () => {
  const { t } = useLingui()
  const [picked, setPicked] = useState<PickedFile[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  const add = (fileList: FileList) => {
    const incoming = Array.from(fileList)

    if (picked.length + incoming.length > MEDIA_MAX_ITEMS) {
      showToastMessage({
        kind: 'error',
        text: t`Можно прикрепить не более ${MEDIA_MAX_ITEMS} файлов`,
      })
      return
    }

    const files = [...picked.map(item => item.file), ...incoming]
    if (totalBytes(files) > MEDIA_MAX_BYTES) {
      showToastMessage({
        kind: 'error',
        text: t`Файл слишком большой: суммарный размер вложений не должен превышать ${MEDIA_MAX_MB} МБ`,
      })
      return
    }

    const next = [...picked, ...incoming.map(toPicked)]
    setPicked(next)
    setActiveIndex(next.length - 1)
  }

  const removeCurrent = () => {
    const target = picked[activeIndex]
    if (!target) return
    URL.revokeObjectURL(target.url)
    const next = picked.filter(file => file.id !== target.id)
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
    files: picked.map(({ file }) => file),
    photos,
    removeCurrent,
    select: setActiveIndex,
  }
}
