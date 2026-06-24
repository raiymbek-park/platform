import { Content, ScreenHeader } from '@raiymbek-park/ui'

import { BottomNav } from '@/widgets/bottom-nav'

import { useEventsData } from '../model/use-events-data'
import { useMarkVisit } from '../model/use-mark-visit'
import { BuildingHero } from './building-hero'
import { ContactsSection } from './contacts-section'
import { ServicesSection } from './services-section'
import { WelcomeFeed } from './welcome-feed'

export const HomePage = () => {
  const { isSuccess } = useEventsData()
  useMarkVisit(isSuccess)

  return (
    <>
      <ScreenHeader />
      <BuildingHero />
      <Content>
        <WelcomeFeed />
        <ServicesSection />
        <ContactsSection />
      </Content>
      <BottomNav active='/home' />
    </>
  )
}
