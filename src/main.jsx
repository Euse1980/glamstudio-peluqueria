import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import { ensureSeedData } from './db/indexedDb'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    },
  },
})

function AppBootstrap() {
  useEffect(() => {
    ensureSeedData()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

const container = document.getElementById('root')
if (container) {
  const root =
    window.__glamReactRoot || (window.__glamReactRoot = ReactDOM.createRoot(container))
  root.render(
    <React.StrictMode>
      <AppBootstrap />
    </React.StrictMode>
  )
}
