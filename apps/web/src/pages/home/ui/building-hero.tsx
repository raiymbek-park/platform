import { LocationBadge } from '@raiymbek-park/ui'

import { useProfileData } from '../model/use-profile-data'
import css from './building-hero.module.scss'

export const BuildingHero = () => {
  const { data } = useProfileData()

  return (
    <section className={css.hero}>
      {data && (
        <LocationBadge
          text={`Блок ${data.block} · Квартира ${data.apartment}`}
        />
      )}
    </section>
  )
}
