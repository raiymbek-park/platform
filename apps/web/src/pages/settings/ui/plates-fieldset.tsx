import { Trans, useLingui } from '@lingui/react/macro'
import { CARS_MAX } from '@raiymbek-park/shared/validation-schemas'
import { Icon, InlineButton, Input } from '@raiymbek-park/ui'

import css from './plates-fieldset.module.scss'

export type PlateRow = {
  id: string
  value: string
}

export type PlatesFieldsetProps = {
  disabled?: boolean
  rows: PlateRow[]
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, value: string) => void
}

export const PlatesFieldset = ({
  disabled,
  rows,
  onAdd,
  onRemove,
  onUpdate,
}: PlatesFieldsetProps) => {
  const { t } = useLingui()

  return (
    <fieldset className={css.group} disabled={disabled}>
      <legend className='sr-only'>
        <Trans>Номера машин</Trans>
      </legend>
      <p className={css.hint}>
        <Trans>
          Добавьте номер автомобиля, чтобы соседи могли связаться с вами в
          случае перекрытия проезда. Для этого включите отображение номера
          телефона.
        </Trans>
      </p>
      {rows.map((row, index) => (
        <Input
          key={row.id}
          icon='car'
          inputMode='text'
          placeholder='A 123 BC 01'
          trailing={
            <button
              aria-label={t`Удалить номер`}
              className={css.remove}
              type='button'
              onClick={() => onRemove(index)}
            >
              <Icon glyph='trash-2' size={20} />
            </button>
          }
          value={row.value}
          onChange={event => onUpdate(index, event.target.value.toUpperCase())}
        />
      ))}
      {rows.length < CARS_MAX && (
        <InlineButton
          glyph='plus'
          label={t`Добавить ещё один номер машины`}
          tone='info'
          onClick={onAdd}
        />
      )}
    </fieldset>
  )
}
