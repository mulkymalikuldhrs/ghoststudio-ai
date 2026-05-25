'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  LayoutDashboard,
  CalendarCheck,
  Wallet,
  Lock,
  MessageSquare,
  Settings,
  Menu,
  ChevronDown,
  Zap,
  Users,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore, type Workspace, type TabId } from '@/lib/store'
import { Dashboard } from '@/components/dashboard'
import { Planner } from '@/components/planner'
import { Finance } from '@/components/finance'
import { Vault } from '@/components/vault'
import { AiAssistant } from '@/components/ai-assistant'
import { SettingsPage } from '@/components/settings'

const navItems: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'planner', label: 'Planner', icon: CalendarCheck },
  { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'vault', label: 'Vault', icon: Lock },
  { id: 'assistant', label: 'AI Assistant', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const levelLabels = ['Observe', 'Suggest', 'Act (Confirm)', 'Full Auto']

interface SidebarContentProps {
  currentWorkspace: Workspace | null
  currentUser: { id: string; email: string; name: string | null; avatar: string | null } | null
  activeTab: TabId
  workspaces: Workspace[]
  trialDaysLeft: number | null
  setTab: (tab: TabId) => void
  setWorkspace: (ws: Workspace | null) => void
}

function SidebarContent({ currentWorkspace, currentUser, activeTab, workspaces, trialDaysLeft, setTab, setWorkspace }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">Famlyzer</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">AI Intelligence</p>
        </div>
      </div>

      <Separator />

      {/* Workspace Selector */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-left">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{currentWorkspace?.name || 'Select workspace'}</p>
                <p className="text-xs text-muted-foreground capitalize">{currentWorkspace?.type || 'No workspace'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {workspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => setWorkspace(ws)}
                className={ws.id === currentWorkspace?.id ? 'bg-emerald-50 dark:bg-emerald-950' : ''}
              >
                <div>
                  <p className="font-medium">{ws.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{ws.type}</p>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1 py-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {item.id === 'assistant' && (
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400">
                    AI
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Bottom Section */}
      <div className="border-t p-3 space-y-2">
        {/* Workspace Status */}
        {currentWorkspace && (
          <div className="px-2 py-1.5 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-xs">
              <Zap className="w-3 h-3 text-emerald-600" />
              <span className="text-muted-foreground">Level:</span>
              <span className="font-medium">{levelLabels[currentWorkspace.autonomousLevel] || 'Observe'}</span>
            </div>
            {trialDaysLeft !== null && (
              <div className="flex items-center gap-2 text-xs mt-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span className="text-muted-foreground">Trial:</span>
                <span className="font-medium text-amber-600">{trialDaysLeft} days left</span>
              </div>
            )}
          </div>
        )}

        {/* User Info */}
        {currentUser && (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
              {(currentUser.name || currentUser.email)[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{currentUser.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function AppLayout() {
  const { currentUser, currentWorkspace, activeTab, setTab, sidebarOpen, setSidebarOpen, workspaces, setWorkspace } = useAppStore()

  const trialEnd = currentWorkspace?.trialEnd ?? null
  const trialDaysLeft = useMemo(() => {
    if (!trialEnd) return null
    const end = new Date(trialEnd)
    const now = new Date()
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }, [trialEnd])

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />
      case 'planner': return <Planner />
      case 'finance': return <Finance />
      case 'vault': return <Vault />
      case 'assistant': return <AiAssistant />
      case 'settings': return <SettingsPage />
      default: return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r bg-card flex-col shrink-0">
        <SidebarContent
          currentWorkspace={currentWorkspace}
          currentUser={currentUser}
          activeTab={activeTab}
          workspaces={workspaces}
          trialDaysLeft={trialDaysLeft}
          setTab={setTab}
          setWorkspace={setWorkspace}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center gap-3 p-3 border-b bg-card">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent
                currentWorkspace={currentWorkspace}
                currentUser={currentUser}
                activeTab={activeTab}
                workspaces={workspaces}
                trialDaysLeft={trialDaysLeft}
                setTab={setTab}
                setWorkspace={setWorkspace}
              />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold truncate">{currentWorkspace?.name || 'Famlyzer'}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <Badge variant="outline" className="text-xs capitalize">{activeTab}</Badge>
          </div>
        </div>

        {/* Page Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-[calc(100vh-57px)] lg:h-screen overflow-y-auto"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
