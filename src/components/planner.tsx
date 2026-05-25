'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Clock, Zap, DollarSign, CalendarCheck, Filter,
  AlertTriangle, CheckCircle2, XCircle, ChevronRight, Sparkles,
  ArrowRight, Timer, Battery, Ban,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import {
  useTasks, useCreateTask, useUpdateTask, useDeleteTask,
  useMembers, useAiOptimizeSchedule,
} from '@/lib/hooks'
import { toast } from 'sonner'

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400',
}

const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
  pending: { icon: Clock, color: 'text-amber-500' },
  approved: { icon: CheckCircle2, color: 'text-emerald-500' },
  done: { icon: CheckCircle2, color: 'text-green-600' },
  rejected: { icon: XCircle, color: 'text-red-500' },
}

export function Planner() {
  const { currentWorkspace } = useAppStore()
  const wsId = currentWorkspace?.id ?? ''
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeCost, setTimeCost] = useState('30')
  const [energyCost, setEnergyCost] = useState('30')
  const [moneyCost, setMoneyCost] = useState('0')
  const [priority, setPriority] = useState('medium')
  const [assignedTo, setAssignedTo] = useState('')

  const { data: tasksData, isLoading } = useTasks(wsId, {
    ...(filterStatus !== 'all' ? { status: filterStatus } : {}),
    ...(filterPriority !== 'all' ? { priority: filterPriority } : {}),
  })
  const { data: membersData } = useMembers(wsId)
  const createTask = useCreateTask(wsId)
  const updateTask = useUpdateTask(wsId, '')
  const deleteTask = useDeleteTask(wsId)
  const optimizeMutation = useAiOptimizeSchedule()

  const tasks = tasksData?.tasks ?? []
  const members = membersData?.members ?? []

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    try {
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        timeCost: parseInt(timeCost) || 0,
        energyCost: parseInt(energyCost) || 0,
        moneyCost: parseFloat(moneyCost) || 0,
        priority,
        assignedTo: assignedTo || undefined,
      })
      toast.success('Task created!')
      setDialogOpen(false)
      setTitle('')
      setDescription('')
      setTimeCost('30')
      setEnergyCost('30')
      setMoneyCost('0')
      setPriority('medium')
      setAssignedTo('')
    } catch {
      toast.error('Failed to create task')
    }
  }

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      await updateTask.mutateAsync({ taskId, status })
      toast.success(`Task ${status}`)
    } catch {
      toast.error('Failed to update task')
    }
  }

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask.mutateAsync(taskId)
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const handleOptimize = async () => {
    try {
      toast.loading('AI optimizing schedule...', { id: 'optimize' })
      const result = await optimizeMutation.mutateAsync({ workspaceId: wsId })
      toast.success('Schedule optimized!', { id: 'optimize' })
      if (result.result) toast.info(result.result.substring(0, 200), { duration: 6000 })
    } catch {
      toast.error('Optimization failed', { id: 'optimize' })
    }
  }

  // Group tasks by status for pipeline view
  const pipelineGroups = [
    { status: 'pending', label: 'Pending', color: 'border-amber-300' },
    { status: 'approved', label: 'Approved', color: 'border-emerald-300' },
    { status: 'done', label: 'Done', color: 'border-green-300' },
  ]

  const getWeekDays = () => {
    const days = []
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      days.push(d)
    }
    return days
  }

  const weekDays = getWeekDays()

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Planner</h1>
          <p className="text-muted-foreground text-sm">Manage tasks and optimize your schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleOptimize}
            disabled={optimizeMutation.isPending}
            variant="outline"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Optimize Schedule
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="mt-1" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" className="mt-1" rows={2} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="flex items-center gap-1"><Timer className="w-3 h-3" /> Time (min)</Label>
                    <Input type="number" value={timeCost} onChange={(e) => setTimeCost(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1"><Battery className="w-3 h-3" /> Energy</Label>
                    <Input type="number" value={energyCost} onChange={(e) => setEnergyCost(e.target.value)} className="mt-1" min="0" max="100" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Cost ($)</Label>
                    <Input type="number" value={moneyCost} onChange={(e) => setMoneyCost(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Assign To</Label>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {members.map((m: { id: string; alias?: string; user?: { name?: string } }) => (
                          <SelectItem key={m.id} value={m.id}>{m.alias || m.user?.name || 'Member'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={createTask.isPending} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                  {createTask.isPending ? 'Creating...' : 'Create Task'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pipelineGroups.map(group => (
          <Card key={group.status} className={`border-t-4 ${group.color}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                {(() => {
                  const cfg = statusConfig[group.status]
                  if (!cfg) return null
                  const Icon = cfg.icon
                  return <Icon className={`w-4 h-4 ${cfg.color}`} />
                })()}
                {group.label}
                <Badge variant="secondary" className="ml-auto text-xs">
                  {tasks.filter((t: { status: string }) => t.status === group.status).length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {tasks
                    .filter((t: { status: string }) => t.status === group.status)
                    .map((task: { id: string; title: string; priority: string; timeCost: number; energyCost: number; moneyCost: number; aiRejected: boolean; aiRejectionReason?: string; assignedTo?: string }, i: number) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{task.title}</p>
                          <Badge className={`text-[10px] shrink-0 ${priorityColors[task.priority] || ''}`}>
                            {task.priority}
                          </Badge>
                        </div>

                        {/* Resource Costs */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{task.timeCost}m</span>
                          <span className="flex items-center gap-1"><Battery className="w-3 h-3" />{task.energyCost}%</span>
                          {task.moneyCost > 0 && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${task.moneyCost}</span>}
                        </div>

                        {/* Energy bar */}
                        <Progress value={task.energyCost} className="h-1 mt-1.5" />

                        {/* AI Rejection */}
                        {task.aiRejected && (
                          <div className="mt-2 p-2 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                              <Ban className="w-3 h-3" /> AI Rejected
                            </p>
                            {task.aiRejectionReason && (
                              <p className="text-xs text-red-500 mt-0.5">{task.aiRejectionReason}</p>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1 mt-2">
                          {task.status === 'pending' && (
                            <Button size="sm" variant="ghost" className="h-6 text-xs text-emerald-600" onClick={() => handleStatusChange(task.id, 'approved')}>
                              Approve <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                          {task.status === 'approved' && (
                            <Button size="sm" variant="ghost" className="h-6 text-xs text-green-600" onClick={() => handleStatusChange(task.id, 'done')}>
                              Complete <CheckCircle2 className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-6 text-xs text-red-500 ml-auto" onClick={() => handleDelete(task.id)}>
                            <XCircle className="w-3 h-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-emerald-500" />
            Week View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, i) => {
              const dayTasks = tasks.filter((t: { dueDate?: string }) => {
                if (!t.dueDate) return false
                const td = new Date(t.dueDate)
                return td.toDateString() === day.toDateString()
              })
              const isToday = day.toDateString() === new Date().toDateString()
              return (
                <div key={i} className={`p-2 rounded-lg min-h-[80px] ${isToday ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800' : 'bg-muted/30'}`}>
                  <p className={`text-xs font-medium mb-1 ${isToday ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {day.toLocaleDateString('en', { weekday: 'short' })}
                    <span className="ml-1">{day.getDate()}</span>
                  </p>
                  {dayTasks.slice(0, 3).map((t: { id: string; title: string; priority: string }) => (
                    <div key={t.id} className="text-[10px] p-1 rounded bg-background border mb-0.5 truncate">
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <p className="text-[10px] text-muted-foreground">+{dayTasks.length - 3} more</p>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
