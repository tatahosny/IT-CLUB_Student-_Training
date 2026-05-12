import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(11, 22, 34, 0.92)',
              color: '#EAFBFF',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(18, 214, 255, 0.15)',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: "'Poppins', sans-serif",
              padding: '12px 20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(18,214,255,0.05)',
            },
            success: {
              iconTheme: { primary: '#9BEA27', secondary: 'transparent' },
              style: { borderLeft: '3px solid #9BEA27', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(155,234,39,0.1)' }
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: 'transparent' },
              style: { borderLeft: '3px solid #EF4444', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(239,68,68,0.1)' }
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service Worker registration failed:', error)
    })
  })
}
