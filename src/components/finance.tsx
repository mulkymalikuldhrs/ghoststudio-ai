'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Wallet, TrendingDown, TrendingUp, ShieldAlert, Target,
  DollarSign, CreditCard, PiggyBank, AlertTriangle, Sparkles,
  ArrowUpRight, ArrowDownRight, Search, Filter,
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/lib/store'
import {
  useAccounts, useCreateAccount,
  useTransactions, useCreateTransaction,
  useBudgetRules, useCreateBudgetRule,
  useFinancialGoals, useCreateFinancialGoal,
  useAiAuditFinances,
} from '@/lib/hooks'
import { toast } from 'sonner'

const accountTypeIcons: Record<string, React.ElementType> = {
  checking: CreditCard,
  savings: PiggyBank,
  investment: TrendingUp,
  cash: DollarSign,
  credit: CreditCard,
}

const categoryColors: Record<string, string> = {
  food: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-400',
  transport: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400',
  housing: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-400',
  health: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400',
  education: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-400',
  entertainment: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export function Finance() {
  const { currentWorkspace } = useAppStore()
  const wsId = currentWorkspace?.id ?? ''

  // Dialog states
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false)
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false)
  const [goalDialogOpen, setGoalDialogOpen] = useState(false)

  // Account form
  const [accName, setAccName] = useState('')
  const [accType, setAccType] = useState('checking')
  const [accBalance, setAccBalance] = useState('0')
  const [accIsEmergency, setAccIsEmergency] = useState(false)

  // Transaction form
  const [txnAmount, setTxnAmount] = useState('')
  const [txnCategory, setTxnCategory] = useState('other')
  const [txnType, setTxnType] = useState('expense')
  const [txnDescription, setTxnDescription] = useState('')

  // Budget form
  const [budgetCategory, setBudgetCategory] = useState('food')
  const [budgetLimit, setBudgetLimit] = useState('')
  const [budgetPriority, setBudgetPriority] = useState('medium')

  // Goal form
  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalDeadline, setGoalDeadline] = useState('')

  // Filters
  const [txnFilter, setTxnFilter] = useState('all')

  // Data hooks
  const { data: accountsData, isLoading: accountsLoading } = useAccounts(wsId)
  const { data: transactionsData } = useTransactions(wsId)
  const { data: budgetRulesData } = useBudgetRules(wsId)
  const { data: goalsData } = useFinancialGoals(wsId)

  const createAccount = useCreateAccount(wsId)
  const createTransaction = useCreateTransaction(wsId)
  const createBudgetRule = useCreateBudgetRule(wsId)
  const createFinancialGoal = useCreateFinancialGoal(wsId)
  const auditMutation = useAiAuditFinances()

  const accounts = accountsData?.accounts ?? []
  const transactions = transactionsData?.transactions ?? []
  const budgetRules = budgetRulesData?.budgetRules ?? []
  const goals = goalsData?.financialGoals ?? []

  const totalBalance = useMemo(() => accounts.reduce((s: number, a: { balance: number }) => s + a.balance, 0), [accounts])
  const emergencyBalance = useMemo(() => accounts.filter((a: { isEmergency: boolean }) => a.isEmergency).reduce((s: number, a: { balance: number }) => s + a.balance, 0), [accounts])

  const monthlyIncome = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return transactions
      .filter((t: { type: string; date: string }) => t.type === 'income' && new Date(t.date) >= monthStart)
      .reduce((s: number, t: { amount: number }) => s + t.amount, 0)
  }, [transactions])

  const monthlyExpenses = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return transactions
      .filter((t: { type: string; date: string }) => t.type === 'expense' && new Date(t.date) >= monthStart)
      .reduce((s: number, t: { amount: number }) => s + t.amount, 0)
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    if (txnFilter === 'all') return transactions
    return transactions.filter((t: { type: string }) => t.type === txnFilter)
  }, [transactions, txnFilter])

  // Category spending for budget check
  const categorySpending = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const spending: Record<string, number> = {}
    transactions
      .filter((t: { type: string; date: string }) => t.type === 'expense' && new Date(t.date) >= monthStart)
      .forEach((t: { category: string; amount: number }) => {
        spending[t.category] = (spending[t.category] || 0) + t.amount
      })
    return spending
  }, [transactions])

  // Handlers
  const handleCreateAccount = async () => {
    if (!accName.trim()) { toast.error('Account name required'); return }
    try {
      await createAccount.mutateAsync({
        name: accName.trim(),
        type: accType,
        balance: parseFloat(accBalance) || 0,
        isEmergency: accIsEmergency,
      })
      toast.success('Account created!')
      setAccountDialogOpen(false)
      setAccName(''); setAccBalance('0'); setAccIsEmergency(false)
    } catch { toast.error('Failed to create account') }
  }

  const handleCreateTransaction = async () => {
    if (!txnAmount || parseFloat(txnAmount) <= 0) { toast.error('Valid amount required'); return }
    try {
      await createTransaction.mutateAsync({
        amount: parseFloat(txnAmount),
        category: txnCategory,
        type: txnType,
        description: txnDescription.trim() || undefined,
      })
      toast.success('Transaction added!')
      setTransactionDialogOpen(false)
      setTxnAmount(''); setTxnDescription('')
    } catch { toast.error('Failed to add transaction') }
  }

  const handleCreateBudgetRule = async () => {
    if (!budgetLimit || parseFloat(budgetLimit) <= 0) { toast.error('Valid limit required'); return }
    try {
      await createBudgetRule.mutateAsync({
        category: budgetCategory,
        limitAmount: parseFloat(budgetLimit),
        priority: budgetPriority,
      })
      toast.success('Budget rule created!')
      setBudgetDialogOpen(false)
      setBudgetLimit('')
    } catch { toast.error('Failed to create budget rule') }
  }

  const handleCreateGoal = async () => {
    if (!goalName.trim()) { toast.error('Goal name required'); return }
    try {
      await createFinancialGoal.mutateAsync({
        name: goalName.trim(),
        targetAmount: parseFloat(goalTarget) || 0,
        deadline: goalDeadline || undefined,
      })
      toast.success('Financial goal created!')
      setGoalDialogOpen(false)
      setGoalName(''); setGoalTarget(''); setGoalDeadline('')
    } catch { toast.error('Failed to create goal') }
  }

  const handleAudit = async () => {
    try {
      toast.loading('Running financial audit...', { id: 'audit' })
      const result = await auditMutation.mutateAsync({ workspaceId: wsId })
      toast.success('Audit complete!', { id: 'audit' })
      if (result.audit) toast.info(result.audit.substring(0, 200), { duration: 8000 })
    } catch {
      toast.error('Audit failed', { id: 'audit' })
    }
  }

  // Check for budget overruns (auto-veto warnings)
  const budgetWarnings = useMemo(() =>
    budgetRules.filter((rule: { category: string; limitAmount: number }) => {
      const spent = categorySpending[rule.category] || 0
      return spent > rule.limitAmount
    }),
    [budgetRules, categorySpending]
  )

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Finance</h1>
          <p className="text-muted-foreground text-sm">Track budgets, accounts, and financial health</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAudit}
            disabled={auditMutation.isPending}
            variant="outline"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Audit
          </Button>
        </div>
      </div>

      {/* Auto-Veto Warnings */}
      {budgetWarnings.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-red-700 dark:text-red-400">AI Veto Alert</span>
              </div>
              <div className="space-y-1">
                {budgetWarnings.map((rule: { id: string; category: string; limitAmount: number }, i: number) => (
                  <p key={rule.id || i} className="text-sm text-red-600 dark:text-red-400">
                    <span className="capitalize">{rule.category}</span> budget exceeded: ${categorySpending[rule.category]?.toFixed(2)} / ${rule.limitAmount.toFixed(2)}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Balance', value: `$${totalBalance.toLocaleString()}`, icon: Wallet, color: 'text-emerald-600', up: true },
          { label: 'Monthly Income', value: `$${monthlyIncome.toLocaleString()}`, icon: TrendingUp, color: 'text-green-600', up: true },
          { label: 'Monthly Expenses', value: `$${monthlyExpenses.toLocaleString()}`, icon: TrendingDown, color: 'text-red-500', up: false },
          { label: 'Emergency Fund', value: `$${emergencyBalance.toLocaleString()}`, icon: ShieldAlert, color: 'text-amber-500', up: true },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={accountsLoading ? 'animate-pulse' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  {stat.up ? <ArrowUpRight className="w-3 h-3 text-emerald-500" /> : <ArrowDownRight className="w-3 h-3 text-red-500" />}
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Your Accounts</h3>
            <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                  <Plus className="w-4 h-4 mr-1" /> Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Create Account</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Account Name</Label>
                    <Input value={accName} onChange={(e) => setAccName(e.target.value)} placeholder="Main Checking" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Type</Label>
                      <Select value={accType} onValueChange={setAccType}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Checking</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                          <SelectItem value="investment">Investment</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="credit">Credit Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Initial Balance ($)</Label>
                      <Input type="number" value={accBalance} onChange={(e) => setAccBalance(e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={accIsEmergency} onCheckedChange={setAccIsEmergency} />
                    <Label>Emergency Fund Account</Label>
                  </div>
                  <Button onClick={handleCreateAccount} disabled={createAccount.isPending} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                    {createAccount.isPending ? 'Creating...' : 'Create Account'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {accounts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {accounts.map((account: { id: string; name: string; type: string; balance: number; isEmergency: boolean; currency: string }, i: number) => {
                const IconComp = accountTypeIcons[account.type] || DollarSign
                return (
                  <motion.div key={account.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className={`hover:shadow-md transition-shadow ${account.isEmergency ? 'border-amber-300 dark:border-amber-700' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${account.isEmergency ? 'bg-amber-100 dark:bg-amber-900' : 'bg-muted'}`}>
                              <IconComp className={`w-4 h-4 ${account.isEmergency ? 'text-amber-600' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{account.name}</p>
                              <Badge variant="outline" className="text-[10px] capitalize">{account.type}</Badge>
                            </div>
                          </div>
                          {account.isEmergency && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-400 text-[10px]">
                              <ShieldAlert className="w-3 h-3 mr-1" /> Emergency
                            </Badge>
                          )}
                        </div>
                        <p className={`text-2xl font-bold ${account.balance < 0 ? 'text-red-500' : ''}`}>
                          {account.balance < 0 ? '-' : ''}${Math.abs(account.balance).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{account.currency || 'USD'}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Wallet className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-30" />
                <p className="text-muted-foreground">No accounts yet. Add your first account to start tracking.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Select value={txnFilter} onValueChange={setTxnFilter}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                  <Plus className="w-4 h-4 mr-1" /> Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Amount ($)</Label>
                      <Input type="number" value={txnAmount} onChange={(e) => setTxnAmount(e.target.value)} placeholder="0.00" className="mt-1" />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select value={txnType} onValueChange={setTxnType}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="income">Income</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Category</Label>
                      <Select value={txnCategory} onValueChange={setTxnCategory}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="transport">Transport</SelectItem>
                          <SelectItem value="housing">Housing</SelectItem>
                          <SelectItem value="health">Health</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input value={txnDescription} onChange={(e) => setTxnDescription(e.target.value)} placeholder="Optional" className="mt-1" />
                    </div>
                  </div>
                  <Button onClick={handleCreateTransaction} disabled={createTransaction.isPending} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                    {createTransaction.isPending ? 'Adding...' : 'Add Transaction'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                {filteredTransactions.length > 0 ? (
                  <div className="divide-y">
                    {filteredTransactions.map((txn: { id: string; amount: number; type: string; category: string; description?: string; date: string }, i: number) => (
                      <motion.div
                        key={txn.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          txn.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-red-100 dark:bg-red-900'
                        }`}>
                          {txn.type === 'income'
                            ? <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                            : <ArrowDownRight className="w-4 h-4 text-red-500" />
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{txn.description || txn.category}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge className={`text-[10px] ${categoryColors[txn.category] || categoryColors.other}`}>
                              {txn.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{new Date(txn.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <p className={`text-sm font-semibold ${txn.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {txn.type === 'income' ? '+' : '-'}${txn.amount.toLocaleString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No transactions yet</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budgets Tab */}
        <TabsContent value="budgets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Budget Rules</h3>
            <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                  <Plus className="w-4 h-4 mr-1" /> Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Create Budget Rule</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Category</Label>
                      <Select value={budgetCategory} onValueChange={setBudgetCategory}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="transport">Transport</SelectItem>
                          <SelectItem value="housing">Housing</SelectItem>
                          <SelectItem value="health">Health</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Monthly Limit ($)</Label>
                      <Input type="number" value={budgetLimit} onChange={(e) => setBudgetLimit(e.target.value)} placeholder="500" className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={budgetPriority} onValueChange={setBudgetPriority}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sacred">Sacred (Never exceed)</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low (Flexible)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateBudgetRule} disabled={createBudgetRule.isPending} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                    {createBudgetRule.isPending ? 'Creating...' : 'Create Rule'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {budgetRules.length > 0 ? (
            <div className="space-y-3">
              {budgetRules.map((rule: { id: string; category: string; limitAmount: number; priority: string; period: string }, i: number) => {
                const spent = categorySpending[rule.category] || 0
                const percentage = rule.limitAmount > 0 ? Math.min((spent / rule.limitAmount) * 100, 100) : 0
                const isOver = spent > rule.limitAmount
                return (
                  <motion.div key={rule.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className={isOver ? 'border-red-200 dark:border-red-800' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs capitalize ${categoryColors[rule.category] || ''}`}>{rule.category}</Badge>
                            <Badge variant="outline" className="text-[10px]">{rule.priority}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground capitalize">{rule.period}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className={isOver ? 'text-red-500 font-medium' : ''}>${spent.toFixed(2)}</span>
                          <span className="text-muted-foreground">${rule.limitAmount.toFixed(2)}</span>
                        </div>
                        <Progress value={percentage} className={`h-2 ${isOver ? '[&>div]:bg-red-500' : percentage > 80 ? '[&>div]:bg-amber-500' : ''}`} />
                        {isOver && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Over budget by ${(spent - rule.limitAmount).toFixed(2)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-30" />
                <p className="text-muted-foreground text-sm">No budget rules yet. Create rules to monitor spending.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Financial Goals</h3>
            <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                  <Plus className="w-4 h-4 mr-1" /> Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Create Financial Goal</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Goal Name</Label>
                    <Input value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="Emergency Fund" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Target Amount ($)</Label>
                      <Input type="number" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} placeholder="10000" className="mt-1" />
                    </div>
                    <div>
                      <Label>Deadline</Label>
                      <Input type="date" value={goalDeadline} onChange={(e) => setGoalDeadline(e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  <Button onClick={handleCreateGoal} disabled={createFinancialGoal.isPending} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                    {createFinancialGoal.isPending ? 'Creating...' : 'Create Goal'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {goals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goals.map((goal: { id: string; name: string; targetAmount: number; currentAmount: number; deadline?: string; priority: string }, i: number) => {
                const percentage = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0
                const isComplete = goal.currentAmount >= goal.targetAmount
                return (
                  <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className={isComplete ? 'border-emerald-300 dark:border-emerald-700' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold">{goal.name}</p>
                          <Badge className={`text-[10px] ${isComplete ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400' : 'bg-muted'}`}>
                            {isComplete ? 'Complete' : goal.priority}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span>${goal.currentAmount.toLocaleString()}</span>
                          <span className="text-muted-foreground">${goal.targetAmount.toLocaleString()}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <div className="flex justify-between mt-1.5">
                          <span className="text-xs text-muted-foreground">{Math.round(percentage)}% achieved</span>
                          {goal.deadline && (
                            <span className="text-xs text-muted-foreground">
                              Due {new Date(goal.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-30" />
                <p className="text-muted-foreground text-sm">No financial goals yet. Set goals to stay on track.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
