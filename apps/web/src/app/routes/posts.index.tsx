import { postSearchSchema } from '@raiymbek-park/shared/validation-schemas'
import { createFileRoute } from '@tanstack/react-router'

import { PostsPage } from '@/pages/posts'

export const Route = createFileRoute('/posts/')({
  component: PostsPage,
  validateSearch: search => postSearchSchema.parse(search),
})
