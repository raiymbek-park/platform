import { useLayoutEffect, useRef, useState } from 'react'

import { Markdown } from '../markdown/markdown'
import css from './content-card.module.scss'

export type CardBodyProps = {
  description: string
  isExpanded?: boolean
}

export const CardBody = ({ description, isExpanded }: CardBodyProps) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const collapsedHeight = useRef<number>(undefined)
  const [maxHeight, setMaxHeight] = useState<number>()
  const [isClamped, setClamped] = useState(!isExpanded)

  useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) return
    if (isClamped) collapsedHeight.current ??= content.clientHeight
    if (isExpanded && isClamped) {
      setClamped(false)
      return
    }
    if (isExpanded) {
      setMaxHeight(content.scrollHeight)
      return
    }
    setMaxHeight(collapsedHeight.current)
  }, [isExpanded, isClamped])

  return (
    <div
      className={css.body}
      style={{ maxHeight }}
      onTransitionEnd={event => {
        if (event.target === event.currentTarget && !isExpanded)
          setClamped(true)
      }}
    >
      <div className={isClamped ? css.clamp : undefined} ref={contentRef}>
        <Markdown content={description} />
      </div>
    </div>
  )
}
