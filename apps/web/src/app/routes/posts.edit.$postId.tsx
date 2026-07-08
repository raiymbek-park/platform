import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/pages/placeholder'

export const Route = createFileRoute('/posts/edit/$postId')({
  component: () => <PlaceholderPage active='/posts' title='Редактировать' />,
})
