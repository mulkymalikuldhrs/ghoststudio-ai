'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Brain, Sparkles, MessageSquare, Bot, User,
  Radio, Activity, DollarSign, ShieldAlert, Clock, Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { useAiChat, useAiAnalyze, useAiSuggest, useAiAgentRun } from '@/lib/hooks'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  agent?: string
  timestamp: Date
}

const agentOptions = [
  { value: 'general', label: 'General Chat', icon: Brain },
  { value: 'planner', label: 'Planner Agent', icon: Clock },
  { value: 'finance', label: 'Finance Agent', icon: DollarSign },
  { value: 'mediator', label: 'Mediator Agent', icon: ShieldAlert },
  { value: 'health', label: 'Health Agent', icon: Activity },
  { value: 'education', label: 'Education Agent', icon: Zap },
  { value: 'memory', label: 'Memory Agent', icon: Brain },
  { value: 'executive', label: 'Executive Agent', icon: Radio },
]

const quickActions = [
  { label: 'Analyze', action: 'analyze', icon: Activity },
  { label: 'Suggest', action: 'suggest', icon: Sparkles },
  { label: 'Optimize', action: 'optimize', icon: Clock },
  { label: 'Audit', action: 'audit', icon: DollarSign },
]

export function AiAssistant() {
  const { currentWorkspace } = useAppStore()
  const wsId = currentWorkspace?.id ?? ''

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('general')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const chatMutation = useAiChat()
  const analyzeMutation = useAiAnalyze()
  const suggestMutation = useAiSuggest()
  const agentRunMutation = useAiAgentRun()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const addMessage = (role: 'user' | 'assistant', content: string, agent?: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      role,
      content,
      agent,
      timestamp: new Date(),
    }])
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    if (!wsId) { toast.error('No workspace selected'); return }

    setInput('')
    addMessage('user', text)

    if (selectedAgent !== 'general') {
      // Run specific agent
      setIsTyping(true)
      try {
        const result = await agentRunMutation.mutateAsync({
          workspaceId: wsId,
          agentType: selectedAgent,
          input: text,
        })
        const response = result.result || result.analysis || 'Agent completed analysis.'
        addMessage('assistant', response, selectedAgent)
      } catch {
        addMessage('assistant', 'Sorry, I encountered an error processing your request. Please try again.')
      }
      setIsTyping(false)
      return
    }

    // General chat
    setIsTyping(true)
    try {
      const chatHistory = messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }))

      const result = await chatMutation.mutateAsync({
        messages: [...chatHistory, { role: 'user', content: text }],
        workspaceId: wsId,
      })

      const response = result.response || result.message || result.content || 'I understand your request. Let me process that for you.'
      addMessage('assistant', response)
    } catch {
      addMessage('assistant', 'I apologize, but I encountered an error. The AI service may be temporarily unavailable. Please try again.')
    }
    setIsTyping(false)
  }

  const handleQuickAction = async (action: string) => {
    if (!wsId) { toast.error('No workspace selected'); return }

    setIsTyping(true)
    try {
      let result: { response?: string; result?: string; analysis?: string; suggestions?: Array<{ title: string }> }
      switch (action) {
        case 'analyze':
          addMessage('user', 'Run a full autonomous analysis on my workspace.')
          result = await analyzeMutation.mutateAsync({ workspaceId: wsId }) as typeof result
          addMessage('assistant', result.analysis || result.result || 'Analysis complete. Check the dashboard for details.')
          break
        case 'suggest':
          addMessage('user', 'Generate suggestions for my workspace.')
          result = await suggestMutation.mutateAsync({ workspaceId: wsId }) as typeof result
          addMessage('assistant', result.suggestions ? `Generated ${result.suggestions.length} new suggestions. Check the dashboard.` : (result.result || 'Suggestions generated successfully.'))
          break
        case 'optimize':
          addMessage('user', 'Optimize my schedule.')
          result = await agentRunMutation.mutateAsync({ workspaceId: wsId, agentType: 'planner' }) as typeof result
          addMessage('assistant', result.result || 'Schedule optimization complete. Check the Planner for updates.')
          break
        case 'audit':
          addMessage('user', 'Run a financial audit.')
          result = await agentRunMutation.mutateAsync({ workspaceId: wsId, agentType: 'finance' }) as typeof result
          addMessage('assistant', result.result || 'Financial audit complete. Check the Finance section for details.')
          break
      }
    } catch {
      addMessage('assistant', 'Action failed. Please try again.')
    }
    setIsTyping(false)
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground text-sm">Chat with Famlyzer AI agents</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {agentOptions.map(agent => (
                <SelectItem key={agent.value} value={agent.value}>
                  <div className="flex items-center gap-2">
                    <agent.icon className="w-3 h-3" />
                    {agent.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Context & Quick Actions */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {currentWorkspace && (
          <Badge variant="outline" className="text-xs">
            {currentWorkspace.name}
          </Badge>
        )}
        <div className="flex items-center gap-1 ml-auto">
          {quickActions.map(action => (
            <Button
              key={action.action}
              size="sm"
              variant="outline"
              className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
              onClick={() => handleQuickAction(action.action)}
              disabled={isTyping}
            >
              <action.icon className="w-3 h-3 mr-1" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Memory Layer Indicator */}
      <Card className="mb-3">
        <CardContent className="p-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground">Memory Layers:</span>
          {[
            { label: 'Short-term', active: true, color: 'bg-emerald-500' },
            { label: 'Long-term', active: true, color: 'bg-blue-500' },
            { label: 'Decisions', active: true, color: 'bg-purple-500' },
            { label: 'Emotional', active: false, color: 'bg-amber-500' },
          ].map(layer => (
            <div key={layer.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${layer.active ? layer.color : 'bg-muted'}`} />
              <span className={`text-xs ${layer.active ? 'text-foreground' : 'text-muted-foreground'}`}>{layer.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Famlyzer AI</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                I can help you manage your time, money, energy, and relationships. 
                Ask me to analyze your finances, optimize your schedule, or resolve conflicts.
              </p>
              <div className="flex items-center gap-2 mt-4">
                {['How can you help?', 'Analyze my budget', 'Optimize my schedule'].map(q => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => { setInput(q) }}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}>
                    {msg.agent && (
                      <Badge variant="outline" className="text-[10px] mb-1 capitalize bg-background/50">
                        {msg.agent} agent
                      </Badge>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-emerald-200' : 'text-muted-foreground'}`}>
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-3">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${agentOptions.find(a => a.value === selectedAgent)?.label || 'Famlyzer AI'}...`}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={isTyping}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shrink-0"
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
