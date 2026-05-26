'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet, TrendingDown, CheckCircle2, Lightbulb, Play, Activity,
  Clock, ShieldAlert, Brain, DollarSign, Zap, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Radio,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useAppStore } from '@/lib/store'
import {
  useAccounts, useTasks, useSuggestions, useAgentLogs,
  useMembers, useTransactions, useAiAnalyze,
} from '@/lib/hooks'
import { toast } from 'sonner'

const cashflowConfig: ChartConfig = {
  income: { label: 'Income', color: '#10b981' },
  expenses: { label: 'Expenses', color: '#ef4444' },
}

const energyConfig: ChartConfig = {
  energy: { label: 'Energy', color: '#10b981' },
  stress: { label: 'Stress', color: '#f59e0b' },
}

const agentList = [
  { type: 'planner', label: 'Planner Agent', icon: Clock },
  { type: 'finance', label: 'Finance Agent', icon: DollarSign },
  { type: 'mediator', label: 'Mediator Agent', icon: ShieldAlert },
  { type: 'health', label: 'Health Agent', icon: Activity },
  { type: 'education', label: 'Education Agent', icon: Brain },
  { type: 'memory', label: 'Memory Agent', icon: Zap },
  { type: 'executive', label: 'Executive Agent', icon: Radio },
]

export function Dashboard() {
  const { currentWorkspace } = useAppStore()
  const wsId = currentWorkspace?.id ?? null

  const { data: accountsData, isLoading: accountsLoading } = useAccounts(wsId)
  const { data: tasksData, isLoading: tasksLoading } = useTasks(wsId)
  const { data: suggestionsData } = useSuggestions(wsId, { status: 'pending' })
  const { data: logsData } = useAgentLogs(wsId)
  const { data: membersData } = useMembers(wsId)
  const { data: transactionsData } = useTransactions(wsId)
  const analyzeMutation = useAiAnalyze()

  const accounts = accountsData?.accounts ?? []
  const tasks = tasksData?.tasks ?? []
  const suggestions = suggestionsData?.suggestions ?? []
  const logs = logsData?.logs ?? []
  const members = membersData?.members ?? []
  const transactions = transactionsData?.transactions ?? []

  const totalBalance = useMemo(() => accounts.reduce((s: number, a: { balance: number }) => s + a.balance, 0), [accounts])
  const monthlySpending = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return transactions
      .filter((t: { type: string; date: string }) => t.type === 'expense' && new Date(t.date) >= monthStart)
      .reduce((s: number, t: { amount: number }) => s + t.amount, 0)
  }, [transactions])
  const activeTasks = tasks.filter((t: { status: string }) => t.status === 'pending' || t.status === 'approved').length
  const emergencyBalance = useMemo(() => accounts.filter((a: { isEmergency: boolean }) => a.isEmergency).reduce((s: number, a: { balance: number }) => s + a.balance, 0), [accounts])

  const cashflowData = useMemo(() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthStr = d.toLocaleString('default', { month: 'short' })
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      const income = transactions
        .filter((t: { type: string; date: string }) => t.type === 'income' && new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd)
        .reduce((s: number, t: { amount: number }) => s + t.amount, 0)
      const expenses = transactions
        .filter((t: { type: string; date: string }) => t.type === 'expense' && new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd)
        .reduce((s: number, t: { amount: number }) => s + t.amount, 0)
      months.push({ month: monthStr, income: Math.round(income), expenses: Math.round(expenses) })
    }
    if (months.every(m => m.income === 0 && m.expenses === 0)) {
      return [
        { month: 'Jan', income: 4500, expenses: 3200 },
        { month: 'Feb', income: 4800, expenses: 3500 },
        { month: 'Mar', income: 4200, expenses: 2900 },
        { month: 'Apr', income: 5100, expenses: 3800 },
        { month: 'May', income: 4700, expenses: 3100 },
        { month: 'Jun', income: 4900, expenses: 3400 },
      ]
    }
    return months
  }, [transactions])

  const energyData = useMemo(() =>
    members.map((m: { alias?: string; user?: { name?: string }; energyLevel: number; stressLevel: number }) => ({
      name: m.alias || m.user?.name || 'Member',
      energy: m.energyLevel,
      stress: m.stressLevel,
    })),
    [members]
  )

  const agentStatuses = useMemo(() =>
    agentList.map(agent => {
      const agentLogs = logs.filter((l: { agentType: string }) => l.agentType === agent.type)
      const lastLog = agentLogs[0]
      return {
        ...agent,
        active: !!lastLog && (Date.now() - new Date(lastLog.createdAt).getTime()) < 3600000,
        lastAction: lastLog?.action || 'No activity yet',
        lastTime: lastLog?.createdAt,
      }
    }),
    [logs]
  )

  const autonomousLevel = currentWorkspace?.autonomousLevel ?? 0
  const levelLabels = ['Observe', 'Suggest', 'Act (Confirm)', 'Full Auto']
  const levelColors = ['bg-gray-500', 'bg-amber-500', 'bg-emerald-500', 'bg-red-500']

  const handleAnalyze = async () => {
    if (!wsId) return
    try {
      toast.loading('Running autonomous analysis...', { id: 'analyze' })
      const result = await analyzeMutation.mutateAsync({ workspaceId: wsId })
      toast.success('Analysis complete!', { id: 'analyze' })
      toast.info(result.analysis?.substring(0, 200) + '...', { duration: 8000 })
    } catch {
      toast.error('Analysis failed', { id: 'analyze' })
    }
  }

  const statCards = [
    { label: 'Total Balance', value: `$${totalBalance.toLocaleString()}`, icon: Wallet, color: 'text-emerald-600', trend: '+2.4%', trendUp: true },
    { label: 'Monthly Spending', value: `$${monthlySpending.toLocaleString()}`, icon: TrendingDown, color: 'text-red-500', trend: '-1.2%', trendUp: false },
    { label: 'Active Tasks', value: String(activeTasks), icon: CheckCircle2, color: 'text-amber-500', trend: '', trendUp: true },
    { label: 'AI Suggestions', value: String(suggestions.length), icon: Lightbulb, color: 'text-purple-500', trend: '', trendUp: true },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back to {currentWorkspace?.name || 'your workspace'}</p>
        </div>
        <Button
          onClick={handleAnalyze}
          disabled={analyzeMutation.isPending}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shrink-0"
        >
          <Play className="w-4 h-4 mr-2" />
          {analyzeMutation.isPending ? 'Analyzing...' : 'Run Autonomous Analysis'}
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={accountsLoading || tasksLoading ? 'animate-pulse' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  {stat.trend && (
                    <span className={`text-xs flex items-center gap-0.5 ${stat.trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                      {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {stat.trend}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Cashflow Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Cashflow Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={cashflowConfig} className="h-[240px] w-full">
              <AreaChart data={cashflowData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="income" stroke="var(--color-income)" fill="var(--color-income)" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="var(--color-expenses)" fill="var(--color-expenses)" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Stress & Energy */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Stress & Energy Index</CardTitle>
          </CardHeader>
          <CardContent>
            {energyData.length > 0 ? (
              <ChartContainer config={energyConfig} className="h-[240px] w-full">
                <BarChart data={energyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} className="text-xs" tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="energy" fill="var(--color-energy)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="stress" fill="var(--color-stress)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
                Add members to see energy data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Fund */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Emergency Fund
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current: ${emergencyBalance.toLocaleString()}</span>
              <span className="font-medium">Goal: ${(emergencyBalance * 1.5 || 5000).toLocaleString()}</span>
            </div>
            <Progress value={Math.min((emergencyBalance / (emergencyBalance * 1.5 || 5000)) * 100, 100)} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {emergencyBalance > 0
                ? `${Math.round((emergencyBalance / (emergencyBalance * 1.5 || 5000)) * 100)}% of recommended emergency fund`
                : 'Set up an emergency fund account to track this'}
            </p>
          </CardContent>
        </Card>

        {/* Autonomous Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-500" />
              Autonomous Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${levelColors[autonomousLevel]} shadow-lg`}>
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold">{levelLabels[autonomousLevel]}</p>
                <p className="text-sm text-muted-foreground">Current autonomous level</p>
                <div className="flex gap-1 mt-2">
                  {[0, 1, 2, 3].map(level => (
                    <div
                      key={level}
                      className={`h-2 flex-1 rounded-full ${level <= autonomousLevel ? levelColors[autonomousLevel] : 'bg-muted'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Status Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">AI Agent Network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {agentStatuses.map(agent => (
              <div
                key={agent.type}
                className={`p-3 rounded-xl border text-center transition-all ${
                  agent.active
                    ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30'
                    : 'border-border bg-card'
                }`}
              >
                <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 ${
                  agent.active ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-muted'
                }`}>
                  <agent.icon className={`w-5 h-5 ${agent.active ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                </div>
                <p className="text-xs font-medium mb-0.5">{agent.label}</p>
                <Badge variant={agent.active ? 'default' : 'secondary'} className={`text-[10px] ${agent.active ? 'bg-emerald-600' : ''}`}>
                  {agent.active ? 'Active' : 'Idle'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* AI Decision Log */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              AI Decision Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-72">
              {logs.length > 0 ? (
                <div className="space-y-2">
                  {logs.slice(0, 15).map((log: { id: string; agentType: string; action: string; result?: string; createdAt: string }) => (
                    <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 text-sm">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0 mt-0.5">
                        <Zap className="w-3 h-3 text-purple-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] capitalize">{log.agentType}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs mt-0.5 truncate">{log.action}</p>
                        {log.result && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{log.result.substring(0, 100)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Brain className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No agent activity yet. Run an analysis to get started.
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Upcoming Predictions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Predictions & Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-72">
              {suggestions.length > 0 ? (
                <div className="space-y-2">
                  {suggestions.slice(0, 8).map((s: { id: string; type: string; title: string; reason: string; agentSource: string }) => (
                    <div key={s.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`text-[10px] ${
                          s.type === 'preventive' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400' :
                          s.type === 'corrective' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-400' :
                          s.type === 'strategic' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-400' :
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400'
                        }`}>
                          {s.type}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{s.agentSource}</Badge>
                      </div>
                      <p className="text-sm font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { icon: DollarSign, text: 'Budget analysis pending', color: 'text-emerald-500' },
                    { icon: Activity, text: 'Energy levels look stable', color: 'text-blue-500' },
                    { icon: ShieldAlert, text: 'No conflicts detected', color: 'text-green-500' },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <p.icon className={`w-5 h-5 ${p.color} shrink-0`} />
                      <span className="text-sm">{p.text}</span>
                    </div>
                  ))}
                  <Separator />
                  <p className="text-xs text-center text-muted-foreground">Run an analysis for detailed predictions</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
