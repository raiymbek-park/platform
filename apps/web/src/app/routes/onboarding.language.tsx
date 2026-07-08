import { createFileRoute } from '@tanstack/react-router'

import { LanguagePage } from '@/pages/onboarding'

export const Route = createFileRoute('/onboarding/language')({
  component: LanguagePage,
})
