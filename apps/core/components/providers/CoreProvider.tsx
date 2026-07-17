'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function CoreProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Most admin data here (users, positions) changes rarely, so the
            // default is tuned for that: skip refetch-on-remount within 30min,
            // keep unused cache entries around for 60min. Queries backing
            // genuinely live/investigative data (e.g. audit logs) must opt
            // out explicitly rather than relying on the library default.
            staleTime: 30 * 60 * 1000,
            gcTime: 60 * 60 * 1000,
          },
        },
      })
  )
  return (
    <>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </>
  )
}
