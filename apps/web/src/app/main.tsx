import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app/app'
import { bootstrapLocale } from '@/shared/i18n'

const rootElement = document.getElementById('root')

if (!rootElement) throw new Error('Root element #root not found')

await bootstrapLocale()

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
