import type { ChangeEvent, ComponentProps, ReactNode } from 'react'

import { joinCss, pickCss } from '@raiymbek-park/shared'

import { Icon } from '../icon'
import css from './image-form.module.scss'

export type ImageFormItem = {
  id: string
  isVideo?: boolean
  url: string
}

export type ImageFormProps = Omit<
  ComponentProps<'div'>,
  'onChange' | 'onSelect'
> & {
  accept?: string
  activeIndex: number
  addLabel: ReactNode
  photos: ImageFormItem[]
  removeLabel: ReactNode
  onAdd: (files: FileList) => void
  onRemove: () => void
  onSelect: (index: number) => void
}

const dotCss = pickCss(css, css.dot)

export const ImageForm = ({
  accept = 'image/*,video/*',
  activeIndex,
  addLabel,
  className,
  photos,
  removeLabel,
  onAdd,
  onRemove,
  onSelect,
  ...restProps
}: ImageFormProps) => {
  const active = photos[activeIndex]

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target
    if (files && files.length > 0) onAdd(files)
    event.target.value = ''
  }

  return (
    <div className={joinCss(css.form, className)} {...restProps}>
      <div className={css.gallery}>
        {active ? (
          active.isVideo ? (
            <video className={css.media} muted src={active.url} />
          ) : (
            <img alt='' className={css.media} src={active.url} />
          )
        ) : (
          <div className={css.placeholder}>
            <Icon glyph='image-plus' size={32} />
          </div>
        )}
        {photos.length > 1 && (
          <div className={css.dots}>
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                aria-label={String(index + 1)}
                className={dotCss({ isActive: index === activeIndex })}
                type='button'
                onClick={() => onSelect(index)}
              />
            ))}
          </div>
        )}
      </div>
      <div className={css.actions}>
        <label className={css.add}>
          <input
            accept={accept}
            className={css.input}
            multiple
            type='file'
            onChange={handleChange}
          />
          <Icon glyph='image-plus' size={20} />
          {addLabel}
        </label>
        <button
          className={css.remove}
          disabled={photos.length === 0}
          type='button'
          onClick={onRemove}
        >
          <Icon glyph='trash-2' size={20} />
          {removeLabel}
        </button>
      </div>
    </div>
  )
}
