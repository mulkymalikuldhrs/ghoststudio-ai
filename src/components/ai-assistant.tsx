'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Brain, Sparkles, MessageSquare, Bot, User,
  Activity, DollarSign, ShieldAlert, Clock, Zap,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

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
]

const quickActions = [
  { label: 'Analyze', action: 'analyze', icon: Activity },
  { label: 'Suggest', action: 'suggest', icon: Sparkles },
  { label: 'Optimize', action: 'optimize', icon: Clock },
  { label: 'Audit', action: 'audit', icon: DollarSign },
]

export function AiAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('general')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

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

    setInput('')
    addMessage('user', text)
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      addMessage('assistant', `I understand your request about "${text}". Let me process that for you. This is a placeholder response — connect the AI service to enable real responses.`, selectedAgent !== 'general' ? selectedAgent : undefined)
      setIsTyping(false)
    }, 1000)
  }

  const handleQuickAction = async (action: string) => {
    setIsTyping(true)
    addMessage('user', `Run ${action} analysis.`)

    setTimeout(() => {
      const responses: Record<string, string> = {
        analyze: 'Analysis complete. Connect the AI service for real results.',
        suggest: 'Suggestions generated. Connect the AI service for real results.',
        optimize: 'Optimization complete. Connect the AI service for real results.',
        audit: 'Audit complete. Connect the AI service for real results.',
      }
      addMessage('assistant', responses[action] || 'Action complete.')
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground text-sm">Chat with GhostStudio AI agents</p>
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

      {/* Quick Actions */}
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        {quickActions.map(action => (
          <Button
            key={action.action}
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => handleQuickAction(action.action)}
            disabled={isTyping}
          >
            <action.icon className="w-3 h-3 mr-1" />
            {action.label}
          </Button>
        ))}
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">GhostStudio AI</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                I can help you create content, generate videos, and optimize your publishing strategy.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}>
                    {msg.agent && (
                      <Badge variant="outline" className="text-[10px] mb-1 capitalize bg-background/50">
                        {msg.agent} agent
                      </Badge>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
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
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
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
              placeholder={`Ask ${agentOptions.find(a => a.value === selectedAgent)?.label || 'GhostStudio AI'}...`}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={isTyping}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
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
