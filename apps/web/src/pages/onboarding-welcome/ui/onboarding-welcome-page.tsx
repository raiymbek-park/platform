import { ScreenHeader } from '@raiymbek-park/ui'

import { RegistrationForm } from '@/features/onboarding/registration-form'

import css from './onboarding-welcome-page.module.scss'

export const OnboardingWelcomePage = () => (
  <section className={css.page}>
    <ScreenHeader title='Регистрация' />
    <RegistrationForm />
  </section>
)
