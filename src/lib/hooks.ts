'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ── Auth ──
export function useAuth() {
  return useMutation({
    mutationFn: async (data: { email: string; name?: string }) => {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Auth setup failed')
      return res.json()
    },
  })
}

// ── User ──
export function useUser(email: string | null) {
  return useQuery({
    queryKey: ['user', email],
    queryFn: async () => {
      const res = await fetch(`/api/user?email=${encodeURIComponent(email!)}`)
      if (!res.ok) throw new Error('Failed to fetch user')
      return res.json()
    },
    enabled: !!email,
  })
}

// ── Workspaces ──
export function useWorkspaces(userId: string | null) {
  return useQuery({
    queryKey: ['workspaces', userId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch workspaces')
      return res.json()
    },
    enabled: !!userId,
  })
}

export function useWorkspace(id: string | null) {
  return useQuery({
    queryKey: ['workspace', id],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${id}`)
      if (!res.ok) throw new Error('Failed to fetch workspace')
      return res.json()
    },
    enabled: !!id,
  })
}

export function useCreateWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; type: string; userId: string }) => {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create workspace')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

export function useUpdateWorkspace(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name?: string; type?: string; autonomousLevel?: number }) => {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update workspace')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace', id] })
      qc.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

// ── Members ──
export function useMembers(workspaceId: string | null) {
  return useQuery({
    queryKey: ['members', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`)
      if (!res.ok) throw new Error('Failed to fetch members')
      return res.json()
    },
    enabled: !!workspaceId,
  })
}

export function useAddMember(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { userId: string; alias?: string; authorityLevel?: number; role?: string }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add member')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members', workspaceId] })
      qc.invalidateQueries({ queryKey: ['workspace', workspaceId] })
    },
  })
}

export function useUpdateMember(workspaceId: string, memberId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update member')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members', workspaceId] })
    },
  })
}

// ── Tasks ──
export function useTasks(workspaceId: string | null, filters?: { status?: string; priority?: string }) {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.priority) params.set('priority', filters.priority)
  const qs = params.toString()

  return useQuery({
    queryKey: ['tasks', workspaceId, filters],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/tasks${qs ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch tasks')
      return res.json()
    },
    enabled: !!workspaceId,
  })
}

export function useCreateTask(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create task')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', workspaceId] })
    },
  })
}

export function useUpdateTask(workspaceId: string, taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update task')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', workspaceId] })
    },
  })
}

export function useDeleteTask(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/tasks/${taskId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete task')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', workspaceId] })
    },
  })
}

// ── Finance Accounts ──
export function useAccounts(workspaceId: string | null) {
  return useQuery({
    queryKey: ['accounts', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/accounts`)
      if (!res.ok) throw new Error('Failed to fetch accounts')
      return res.json()
    },
    enabled: !!workspaceId,
  })
}

export function useCreateAccount(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create account')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts', workspaceId] })
    },
  })
}

// ── Transactions ──
export function useTransactions(workspaceId: string | null, filters?: { category?: string; type?: string }) {
  const params = new URLSearchParams()
  if (filters?.category) params.set('category', filters.category)
  if (filters?.type) params.set('type', filters.type)
  const qs = params.toString()

  return useQuery({
    queryKey: ['transactions', workspaceId, filters],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/transactions${qs ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch transactions')
      return res.json()
    },
    enabled: !!workspaceId,
  })
}

export function useCreateTransaction(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create transaction')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', workspaceId] })
      qc.invalidateQueries({ queryKey: ['accounts', workspaceId] })
    },
  })
}

// ── Budget Rules ──
export function useBudgetRules(workspaceId: string | null) {
  return useQuery({
    queryKey: ['budgetRules', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/budget-rules`)
      if (!res.ok) throw new Error('Failed to fetch budget rules')
      return res.json()
    },
    enabled: !!workspaceId,
  })
}

export function useCreateBudgetRule(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/budget-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create budget rule')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgetRules', workspaceId] })
    },
  })
}

// ── Financial Goals ──
export function useFinancialGoals(workspaceId: string | null) {
  return useQuery({
    queryKey: ['financialGoals', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/financial-goals`)
      if (!res.ok) throw new Error('Failed to fetch financial goals')
      return res.json()
    },
    enabled: !!workspaceId,
  })
}

export function useCreateFinancialGoal(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/financial-goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create financial goal')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financialGoals', workspaceId] })
    },
  })
}

// ── Vault ──
export function useVaultDocuments(workspaceId: string | null, filters?: { type?: string; scope?: string }) {
  const params = new URLSearchParams()
  if (filters?.type) params.set('type', filters.type)
  if (filters?.scope) params.set('scope', filters.scope)
  const qs = params.toString()

  return useQuery({
    queryKey: ['vaultDocuments', workspaceId, filters],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/vault${qs ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch vault documents')
      return res.json()
    },
    enabled: !!workspaceId,
  })
}

export function useCreateVaultDocument(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/vault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create vault document')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vaultDocuments', workspaceId] })
    },
  })
}

export function useUpdateVaultDocument(workspaceId: string, docId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/vault/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update vault document')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vaultDocuments', workspaceId] })
    },
  })
}

export function useDeleteVaultDocument(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (docId: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/vault/${docId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete vault document')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vaultDocuments', workspaceId] })
    },
  })
}

// ── Memories ──
export function useMemories(workspaceId: string | null, layer?: string) {
  const params = new URLSearchParams()
  if (layer) params.set('layer', layer)
  const qs = params.toString()

  return useQuery({
    queryKey: ['memories', workspaceId, layer],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/memories${qs ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch memories')
      return res.json()
    },
    enabled: !!workspaceId,
  })
}

export function useDeleteMemory(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (memoryId: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/memories/${memoryId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete memory')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memories', workspaceId] })
    },
  })
}

// ── Suggestions ──
export function useSuggestions(workspaceId: string | null, filters?: { status?: string; type?: string }) {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.type) params.set('type', filters.type)
  const qs = params.toString()

  return useQuery({
    queryKey: ['suggestions', workspaceId, filters],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/suggestions${qs ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch suggestions')
      return res.json()
    },
    enabled: !!workspaceId,
  })
}

export function useUpdateSuggestion(workspaceId: string, suggestionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/suggestions/${suggestionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update suggestion')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suggestions', workspaceId] })
    },
  })
}

// ── Agent Logs ──
export function useAgentLogs(workspaceId: string | null, agentType?: string) {
  const params = new URLSearchParams()
  if (agentType) params.set('agentType', agentType)
  const qs = params.toString()

  return useQuery({
    queryKey: ['agentLogs', workspaceId, agentType],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/agent-logs${qs ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch agent logs')
      return res.json()
    },
    enabled: !!workspaceId,
  })
}

// ── Subscriptions ──
export function useSubscriptions(userId: string | null) {
  return useQuery({
    queryKey: ['subscriptions', userId],
    queryFn: async () => {
      const res = await fetch(`/api/subscriptions?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch subscriptions')
      return res.json()
    },
    enabled: !!userId,
  })
}

export function useCreateSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { userId: string; tier: string; period?: string }) => {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create subscription')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })
}

// ── AI ──
export function useAiChat() {
  return useMutation({
    mutationFn: async (data: { messages: Array<{ role: string; content: string }>; workspaceId?: string; context?: string }) => {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('AI chat failed')
      return res.json()
    },
  })
}

export function useAiAnalyze() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { workspaceId: string }) => {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('AI analysis failed')
      return res.json()
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['agentLogs', variables.workspaceId] })
      qc.invalidateQueries({ queryKey: ['memories', variables.workspaceId] })
      qc.invalidateQueries({ queryKey: ['suggestions', variables.workspaceId] })
    },
  })
}

export function useAiSuggest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { workspaceId: string; type?: string }) => {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('AI suggest failed')
      return res.json()
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['suggestions', variables.workspaceId] })
    },
  })
}

export function useAiOptimizeSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { workspaceId: string }) => {
      const res = await fetch('/api/ai/optimize-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('AI optimize schedule failed')
      return res.json()
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks', variables.workspaceId] })
      qc.invalidateQueries({ queryKey: ['agentLogs', variables.workspaceId] })
    },
  })
}

export function useAiAuditFinances() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { workspaceId: string }) => {
      const res = await fetch('/api/ai/audit-finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('AI audit finances failed')
      return res.json()
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['agentLogs', variables.workspaceId] })
      qc.invalidateQueries({ queryKey: ['suggestions', variables.workspaceId] })
    },
  })
}

export function useAiAgentRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { workspaceId: string; agentType: string }) => {
      const res = await fetch('/api/ai/agent-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('AI agent run failed')
      return res.json()
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['agentLogs', variables.workspaceId] })
      qc.invalidateQueries({ queryKey: ['memories', variables.workspaceId] })
      qc.invalidateQueries({ queryKey: ['suggestions', variables.workspaceId] })
    },
  })
}
