import type { BlockId } from '@raiymbek-park/shared/validation-schemas'
import type { BlockCardProps } from '@raiymbek-park/ui'

import { Trans, useLingui } from '@lingui/react/macro'
import { blockFloors, blockIds } from '@raiymbek-park/shared/validation-schemas'
import { BlockCard } from '@raiymbek-park/ui'

import css from './fields.module.scss'

const blockTones: Record<BlockId, NonNullable<BlockCardProps['tone']>> = {
  1: 'danger',
  2: 'brand',
  3: 'accent',
  4: 'info',
}

export type BlockPickerProps = {
  disabled?: boolean
  value: BlockId | null
  onChange: (block: BlockId) => void
}

export const BlockPicker = ({
  disabled,
  value,
  onChange,
}: BlockPickerProps) => {
  const { t } = useLingui()

  return (
    <fieldset className={css.group} disabled={disabled}>
      <legend className='sr-only'>
        <Trans>Блок</Trans>
      </legend>
      <div className={css.blocks}>
        {blockIds.map(block => (
          <BlockCard
            key={block}
            description={t`${blockFloors[block]} жилых этажей`}
            icon='building-2'
            isSelected={value === block}
            title={t`Блок ${block}`}
            tone={blockTones[block]}
            onClick={() => onChange(block)}
          />
        ))}
      </div>
    </fieldset>
  )
}
