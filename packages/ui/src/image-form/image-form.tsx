import type { ChangeEvent, ComponentProps, ReactNode } from 'react'
import type { CarouselItem } from '../carousel/carousel'

import { joinCss } from '@raiymbek-park/shared'

import { Carousel } from '../carousel/carousel'
import { Icon } from '../icon'
import css from './image-form.module.scss'

export type ImageFormItem = CarouselItem

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

const placeholderSrc = `${import.meta.env.BASE_URL}images/add-images.png`

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
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target
    if (files && files.length > 0) onAdd(files)
    event.target.value = ''
  }

  const isEmpty = photos.length === 0

  return (
    <div className={joinCss(css.form, className)} {...restProps}>
      <div className={joinCss(css.gallery, isEmpty && css.galleryEmpty)}>
        {isEmpty ? (
          <img alt='' className={css.placeholder} src={placeholderSrc} />
        ) : (
          <Carousel
            activeIndex={activeIndex}
            items={photos}
            onIndexChange={onSelect}
          />
        )}
      </div>
      <div className={joinCss(css.actions, isEmpty && css.actionsEmpty)}>
        <label className={css.add}>
          <input
            accept={accept}
            className={css.input}
            multiple
            type='file'
            onChange={handleChange}
          />
          <Icon glyph='image-plus' size={16} />
          {addLabel}
        </label>
        {!isEmpty && (
          <button className={css.remove} type='button' onClick={onRemove}>
            <Icon glyph='trash-2' size={16} />
            {removeLabel}
          </button>
        )}
      </div>
    </div>
  )
}
