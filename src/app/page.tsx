'use client'

import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Onboarding } from '@/components/onboarding'
import { AppLayout } from '@/components/app-layout'
import { useAppStore } from '@/lib/store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
})

function AppContent() {
  const { currentUser, currentWorkspace, setUser, setWorkspace, setWorkspaces } = useAppStore()
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('famlyzer_user')
      const savedWorkspace = localStorage.getItem('famlyzer_workspace')
      const savedWorkspaces = localStorage.getItem('famlyzer_workspaces')

      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
      if (savedWorkspace) {
        setWorkspace(JSON.parse(savedWorkspace))
      }
      if (savedWorkspaces) {
        setWorkspaces(JSON.parse(savedWorkspaces))
      }
    } catch (e) {
      console.error('Failed to hydrate state', e)
    }
    setHydrated(true)
  }, [setUser, setWorkspace, setWorkspaces])

  // Persist to localStorage
  useEffect(() => {
    if (!hydrated) return
    if (currentUser) localStorage.setItem('famlyzer_user', JSON.stringify(currentUser))
    else localStorage.removeItem('famlyzer_user')
  }, [currentUser, hydrated])

  useEffect(() => {
    if (!hydrated) return
    if (currentWorkspace) localStorage.setItem('famlyzer_workspace', JSON.stringify(currentWorkspace))
    else localStorage.removeItem('famlyzer_workspace')
  }, [currentWorkspace, hydrated])

  useEffect(() => {
    if (!hydrated) return
    const { workspaces } = useAppStore.getState()
    if (workspaces.length > 0) localStorage.setItem('famlyzer_workspaces', JSON.stringify(workspaces))
  }, [useAppStore.getState().workspaces, hydrated])

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 4a2 2 0 1 1-2 2 2 2 0 0 1 2-2zm2 10H10v-1h1v-3h-1v-1h3v4h1z" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading Famlyzer AI...</p>
        </div>
      </div>
    )
  }

  // Show onboarding if no user or no workspace
  if (!currentUser || !currentWorkspace) {
    return <Onboarding />
  }

  return <AppLayout />
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
