import { useLingui } from '@lingui/react/macro'
import { LocationBadge } from '@raiymbek-park/ui'

import { useProfileData } from '../model/use-profile-data'
import css from './building-hero.module.scss'

export const BuildingHero = () => {
  const { data } = useProfileData()
  const { t } = useLingui()

  return (
    <section className={css.hero}>
      {data && (
        <LocationBadge
          text={t`Блок ${data.block} · Квартира ${data.apartment}`}
        />
      )}
    </section>
  )
}
