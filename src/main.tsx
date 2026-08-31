import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { reportError } from './lib/errorReporter'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthProvider } from './store/auth'
import { FarmProvider } from './store/farm'
import './styles/globals.css'
import App from './App.tsx'

window.addEventListener('error', (event) => {
  reportError({
    title: 'Erro global (window.onerror)',
    message: event.message || String(event.error ?? ''),
    stack: event.error instanceof Error ? event.error.stack : undefined,
    url: event.filename,
  })
})

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  reportError({
    title: 'Promise não tratada (unhandledrejection)',
    message: reason instanceof Error ? reason.message : String(reason ?? ''),
    stack: reason instanceof Error ? reason.stack : undefined,
  })
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FarmProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </FarmProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)