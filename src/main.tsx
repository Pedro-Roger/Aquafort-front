import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './store/auth'
import { FarmProvider } from './store/farm'
import './styles/globals.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FarmProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </FarmProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
