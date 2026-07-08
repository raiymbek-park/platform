import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/pages/placeholder'

export const Route = createFileRoute('/posts/new')({
  component: () => <PlaceholderPage active='/posts' title='Новое объявление' />,
})
