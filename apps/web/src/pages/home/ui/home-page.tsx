import { Content, ScreenHeader } from '@raiymbek-park/ui'

import { BottomNav } from '@/widgets/bottom-nav'

import { BuildingHero } from './building-hero'
import { ContactsSection } from './contacts-section'
import { ServicesSection } from './services-section'
import { WelcomeFeed } from './welcome-feed'

export const HomePage = () => (
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
