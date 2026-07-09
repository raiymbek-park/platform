import { createFileRoute } from '@tanstack/react-router'

import { PostFormPage } from '@/pages/post-form'

export const Route = createFileRoute('/posts/new')({
  component: PostFormPage,
})
