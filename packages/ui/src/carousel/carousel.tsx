import type { ComponentProps, PointerEvent } from 'react'

import { joinCss, pickCss } from '@raiymbek-park/shared'
import { useCallback, useEffect, useRef, useState } from 'react'

import placeholder from '../issue-card/image-placeholder.jpg'
import css from './carousel.module.scss'
import { isVideoUrl } from './is-video-url'

export type CarouselItem = {
  id: string
  isVideo?: boolean
  url: string
}

export type CarouselProps = Omit<ComponentProps<'div'>, 'onChange'> & {
  activeIndex?: number
  items: CarouselItem[]
  showDots?: boolean
  onIndexChange?: (index: number) => void
  onNaturalHeight?: (height: number) => void
}

const trackCss = pickCss(css, css.track)
const dotCss = pickCss(css, css.dot)

const SWIPE_THRESHOLD = 50

const MediaSlide = ({
  item,
  onLoad,
}: {
  item: CarouselItem
  onLoad: () => void
}) => {
  const isVideo = item.isVideo ?? isVideoUrl(item.url)
  const [src, setSrc] = useState(placeholder)

  useEffect(() => {
    if (isVideo) return
    const image = new Image()
    image.onload = () => setSrc(item.url)
    image.src = item.url
    return () => {
      image.onload = null
    }
  }, [isVideo, item.url])

  return isVideo ? (
    <video
      className={css.media}
      controls
      muted
      playsInline
      preload='metadata'
      src={item.url}
      onLoadedMetadata={onLoad}
    />
  ) : (
    <img
      alt=''
      className={css.media}
      draggable={false}
      src={src}
      onLoad={onLoad}
    />
  )
}

export const Carousel = ({
  activeIndex,
  className,
  items,
  showDots = true,
  onIndexChange,
  onNaturalHeight,
  ...restProps
}: CarouselProps) => {
  const [internalIndex, setInternalIndex] = useState(0)
  const [drag, setDrag] = useState(0)
  const [isDragging, setDragging] = useState(false)
  const startX = useRef<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const index = activeIndex ?? internalIndex

  const reportHeight = useCallback(() => {
    if (!onNaturalHeight) return
    const width = rootRef.current?.clientWidth
    const media = trackRef.current?.children.item(index)
    if (!width) return
    if (media instanceof HTMLImageElement && media.naturalWidth)
      onNaturalHeight(width * (media.naturalHeight / media.naturalWidth))
    if (media instanceof HTMLVideoElement && media.videoWidth)
      onNaturalHeight(width * (media.videoHeight / media.videoWidth))
  }, [index, onNaturalHeight])

  useEffect(reportHeight, [reportHeight])

  const change = (next: number) => {
    setInternalIndex(next)
    onIndexChange?.(next)
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (items.length < 2) return
    startX.current = event.clientX
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return
    setDrag(event.clientX - startX.current)
  }

  const reset = () => {
    startX.current = null
    setDrag(0)
    setDragging(false)
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return
    const delta = event.clientX - startX.current
    if (delta < -SWIPE_THRESHOLD && index < items.length - 1) change(index + 1)
    else if (delta > SWIPE_THRESHOLD && index > 0) change(index - 1)
    reset()
  }

  return (
    <div
      ref={rootRef}
      className={joinCss(css.carousel, className)}
      {...restProps}
      onPointerCancel={reset}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        ref={trackRef}
        className={trackCss({ isDragging })}
        style={{
          transform: `translateX(calc(${-index * 100}% + ${drag}px))`,
        }}
      >
        {items.map(item => (
          <MediaSlide key={item.id} item={item} onLoad={reportHeight} />
        ))}
      </div>
      {showDots && items.length > 1 && (
        <div className={css.dots}>
          {items.map((item, dotIndex) => (
            <button
              key={item.id}
              aria-label={String(dotIndex + 1)}
              className={dotCss({ isActive: dotIndex === index })}
              type='button'
              onClick={() => change(dotIndex)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
