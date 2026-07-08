import type { ComponentProps } from 'react'
import type { Components } from 'react-markdown'

import { joinCss } from '@raiymbek-park/shared'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import css from './markdown.module.scss'

export type MarkdownProps = Omit<ComponentProps<'div'>, 'children'> & {
  content: string
}

const components: Components = {
  a: ({ node: _node, ...props }) => (
    <a {...props} rel='noopener noreferrer' target='_blank' />
  ),
}

export const Markdown = ({
  className,
  content,
  ...restProps
}: MarkdownProps) => (
  <div className={joinCss(css.markdown, className)} {...restProps}>
    <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  </div>
)
