import { createFileRoute } from '@tanstack/react-router'

import { PostFormPage } from '@/pages/post-form'

const RouteComponent = () => {
  const { postId } = Route.useParams()
  return <PostFormPage postId={postId} />
}

export const Route = createFileRoute('/posts/edit/$postId')({
  component: RouteComponent,
})
