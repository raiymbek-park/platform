import { useState } from 'react'

import { Carousel } from '../carousel/carousel'
import css from './content-card.module.scss'

export type CardMediaProps = {
  isExpanded?: boolean
  media: string[]
}

export const CardMedia = ({ isExpanded, media }: CardMediaProps) => {
  const [naturalHeight, setNaturalHeight] = useState(150)

  return (
    <div
      className={css.media}
      style={isExpanded ? { height: naturalHeight } : undefined}
    >
      <Carousel
        items={media.map(url => ({ id: url, url }))}
        showDots={isExpanded}
        onNaturalHeight={setNaturalHeight}
      />
    </div>
  )
}
