'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon, Brain, Zap, Users, CreditCard,
  Shield, Trash2, Download, Sparkles, Crown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import {
  useUpdateWorkspace, useMembers, useMemories, useSubscriptions,
} from '@/lib/hooks'
import { toast } from 'sonner'

const levelLabels = ['Observe', 'Suggest', 'Act (Confirm)', 'Full Auto']
const levelDescriptions = [
  'AI only observes and records data without taking action.',
  'AI provides suggestions but waits for your approval.',
  'AI takes action but asks for confirmation first.',
  'AI acts fully autonomously within safety boundaries.',
]
const levelColors = ['bg-gray-500', 'bg-amber-500', 'bg-emerald-500', 'bg-red-500']

const subscriptionTiers = [
  { id: 'free', name: 'Starter', price: 0, period: 'Free forever', features: ['1 workspace', '3 users', 'Advisory level only'], level: 1, icon: Users },
  { id: 'professional', name: 'Professional', price: 19, period: '/mo', features: ['5 workspaces', '15 users', 'Semi-autonomous', 'Priority support'], level: 2, icon: Zap },
  { id: 'business', name: 'Business', price: 49, period: '/mo', features: ['Unlimited workspaces', 'Unlimited users', 'Fully autonomous', 'Premium support', 'Custom agents'], level: 3, icon: Crown },
]

export function SettingsPage() {
  const { currentWorkspace, currentUser } = useAppStore()
  const wsId = currentWorkspace?.id ?? ''

  const [wsName, setWsName] = useState(currentWorkspace?.name || '')
  const [wsType, setWsType] = useState(currentWorkspace?.type || 'personal')

  const updateWorkspace = useUpdateWorkspace(wsId)
  const { data: membersData } = useMembers(wsId)
  const { data: memoriesData } = useMemories(wsId)
  const { data: subscriptionsData } = useSubscriptions(currentUser?.id ?? null)

  const members = membersData?.members ?? []
  const memories = memoriesData?.memories ?? []
  const subscriptions = subscriptionsData?.subscriptions ?? []

  const trialEnd = currentWorkspace?.trialEnd ?? null
  const trialDaysLeft = useMemo(() => {
    if (!trialEnd) return 0
    const end = new Date(trialEnd)
    const now = new Date()
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }, [trialEnd])

  const isTrialExpired = trialDaysLeft === 0

  const handleUpdateWorkspace = async () => {
    try {
      await updateWorkspace.mutateAsync({ name: wsName, type: wsType })
      toast.success('Workspace updated!')
    } catch {
      toast.error('Failed to update workspace')
    }
  }

  const handleAutonomousLevelChange = async (level: number) => {
    try {
      await updateWorkspace.mutateAsync({ autonomousLevel: level })
      toast.success(`Autonomous level set to: ${levelLabels[level]}`)
    } catch {
      toast.error('Failed to update autonomous level')
    }
  }

  const handleExportData = () => {
    toast.info('Data export feature coming soon. All data is stored in your workspace database.')
  }

  // Memory stats
  const memoryStats = useMemo(() => {
    const stats: Record<string, number> = { short_term: 0, long_term: 0, decision: 0, emotional: 0 }
    memories.forEach((m: { layer: string }) => { stats[m.layer] = (stats[m.layer] || 0) + 1 })
    return stats
  }, [memories])

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-emerald-600" />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">Configure your workspace and AI preferences</p>
      </div>

      <Tabs defaultValue="workspace" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="autonomous">Autonomous</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
        </TabsList>

        {/* Workspace Settings */}
        <TabsContent value="workspace" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Workspace Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Workspace Name</Label>
                <Input value={wsName} onChange={(e) => setWsName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Workspace Type</Label>
                <Select value={wsType} onValueChange={setWsType}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="company">Company / Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleUpdateWorkspace}
                disabled={updateWorkspace.isPending}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              >
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Data Management</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Export All Data</p>
                  <p className="text-xs text-muted-foreground">Download your workspace data</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportData}>
                  <Download className="w-4 h-4 mr-1" /> Export
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Workspace ID</p>
                  <p className="text-xs text-muted-foreground font-mono">{currentWorkspace?.id || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Autonomous Level */}
        <TabsContent value="autonomous" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-5 h-5 text-emerald-600" />
                Autonomous Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Control how much autonomy the AI has in making decisions and taking actions within your workspace.
              </p>

              <div className="space-y-3">
                {levelLabels.map((label, level) => {
                  const isActive = currentWorkspace?.autonomousLevel === level
                  return (
                    <motion.div
                      key={level}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <button
                        onClick={() => handleAutonomousLevelChange(level)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          isActive
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-md'
                            : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${levelColors[level]} shadow-sm`}>
                            <span className="text-white font-bold text-sm">{level}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{label}</p>
                              {isActive && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400 text-[10px]">Active</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{levelDescriptions[level]}</p>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              {members.length > 0 ? (
                <div className="space-y-3">
                  {members.map((member: { id: string; alias?: string; user?: { name?: string; email?: string }; authorityLevel: number; energyLevel: number; stressLevel: number; role: string }, i: number) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-xl border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {(member.alias || member.user?.name || 'M')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{member.alias || member.user?.name || 'Member'}</p>
                            <Badge variant="outline" className="text-[10px] capitalize">{member.role}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{member.user?.email || 'No email'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground">Authority</p>
                          <p className="text-sm font-bold">{member.authorityLevel}/5</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground">Energy</p>
                          <p className="text-sm font-bold">{member.energyLevel}%</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground">Stress</p>
                          <p className="text-sm font-bold">{member.stressLevel}%</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No members yet. Members are added through the workspace.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription */}
        <TabsContent value="subscription" className="space-y-4">
          {/* Trial Status */}
          <Card className={isTrialExpired ? 'border-red-200 dark:border-red-800' : 'border-amber-200 dark:border-amber-800'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isTrialExpired ? 'bg-red-100 dark:bg-red-900' : 'bg-amber-100 dark:bg-amber-900'}`}>
                  <Sparkles className={`w-6 h-6 ${isTrialExpired ? 'text-red-600' : 'text-amber-600'}`} />
                </div>
                <div>
                  <p className="font-semibold">{isTrialExpired ? 'Trial Expired' : `${trialDaysLeft} Days Left in Trial`}</p>
                  <p className="text-sm text-muted-foreground">
                    {isTrialExpired ? 'Subscribe to continue using AI features' : 'All features active during trial period'}
                  </p>
                </div>
              </div>
              {!isTrialExpired && (
                <Progress value={((7 - trialDaysLeft) / 7) * 100} className="h-2 mt-3" />
              )}
            </CardContent>
          </Card>

          {/* Pricing Tiers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {subscriptionTiers.map((tier, i) => {
              const isCurrentTier = currentWorkspace?.subscriptionTier === tier.id
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className={`h-full ${isCurrentTier ? 'border-emerald-300 shadow-lg dark:border-emerald-700' : ''}`}>
                    <CardContent className="p-4 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-3">
                        <tier.icon className={`w-5 h-5 ${isCurrentTier ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                        <span className="font-semibold">{tier.name}</span>
                        {isCurrentTier && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400 text-[10px] ml-auto">Current</Badge>}
                      </div>
                      <div className="mb-3">
                        <span className="text-2xl font-bold">${tier.price}</span>
                        <span className="text-sm text-muted-foreground">{tier.period}</span>
                      </div>
                      <div className="flex-1 space-y-1.5 mb-4">
                        {tier.features.map((f, j) => (
                          <div key={j} className="flex items-center gap-2 text-xs">
                            <Shield className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant={isCurrentTier ? 'outline' : 'default'}
                        className={`w-full ${!isCurrentTier ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : ''}`}
                        disabled={isCurrentTier}
                      >
                        {isCurrentTier ? 'Current Plan' : 'Upgrade'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        {/* Memory */}
        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-5 h-5 text-emerald-600" />
                Memory System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The 4-layer memory system stores context, habits, decisions, and emotional patterns to make AI smarter over time.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Short-term', key: 'short_term', color: 'bg-emerald-500', desc: 'Recent context (24h)', limit: 100 },
                  { label: 'Long-term', key: 'long_term', color: 'bg-blue-500', desc: 'Habit patterns (90d)', limit: 1000 },
                  { label: 'Decisions', key: 'decision', color: 'bg-purple-500', desc: 'Decision history', limit: 500 },
                  { label: 'Emotional', key: 'emotional', color: 'bg-amber-500', desc: 'Emotional patterns', limit: 200 },
                ].map(layer => {
                  const count = memoryStats[layer.key] || 0
                  return (
                    <div key={layer.key} className="p-3 rounded-xl border text-center">
                      <div className={`w-8 h-8 mx-auto rounded-lg ${layer.color} flex items-center justify-center mb-2`}>
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm font-medium">{layer.label}</p>
                      <p className="text-2xl font-bold mt-1">{count}</p>
                      <p className="text-xs text-muted-foreground">{count}/{layer.limit}</p>
                      <Progress value={Math.min((count / layer.limit) * 100, 100)} className="h-1.5 mt-1.5" />
                      <p className="text-[10px] text-muted-foreground mt-1">{layer.desc}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Memories */}
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Memories</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64">
                {memories.length > 0 ? (
                  <div className="space-y-2">
                    {memories.slice(0, 20).map((mem: { id: string; layer: string; category?: string; content: string; importance: number; createdAt: string }, i: number) => (
                      <div key={mem.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                        <Badge variant="outline" className="text-[10px] capitalize shrink-0">{mem.layer.replace('_', ' ')}</Badge>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs line-clamp-2">{mem.content}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(mem.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No memories stored yet. AI interactions will create memories over time.
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
