'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Sparkles, Users, Shield, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { useAuth, useCreateWorkspace } from '@/lib/hooks'
import { toast } from 'sonner'

export function Onboarding() {
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [wsName, setWsName] = useState('')
  const [wsType, setWsType] = useState('personal')

  const { setUser, setWorkspace, setWorkspaces } = useAppStore()
  const authMutation = useAuth()
  const createWorkspaceMutation = useCreateWorkspace()

  const handleAuth = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email')
      return
    }
    try {
      const result = await authMutation.mutateAsync({ email: email.trim(), name: name.trim() || undefined })
      setUser(result.user)
      if (result.workspaces && result.workspaces.length > 0) {
        setWorkspaces(result.workspaces)
        setWorkspace(result.workspaces[0])
        return
      }
      setStep(2)
    } catch {
      toast.error('Failed to setup account')
    }
  }

  const handleCreateWorkspace = async () => {
    if (!wsName.trim()) {
      toast.error('Please enter a workspace name')
      return
    }
    const user = useAppStore.getState().currentUser
    if (!user) return
    try {
      const result = await createWorkspaceMutation.mutateAsync({
        name: wsName.trim(),
        type: wsType,
        userId: user.id,
      })
      setWorkspace(result.workspace)
      setWorkspaces([result.workspace])
      setStep(3)
    } catch {
      toast.error('Failed to create workspace')
    }
  }

  const handleFinish = () => {
    setStep(4)
  }

  const features = [
    { icon: Brain, title: 'AI-Powered Planning', desc: 'Autonomous agents analyze your schedule and optimize tasks' },
    { icon: Shield, title: 'Financial Guardian', desc: 'Real-time budget monitoring with AI veto on overspending' },
    { icon: Users, title: 'Family Coordination', desc: 'Energy & stress tracking for every member' },
    { icon: Sparkles, title: 'Knowledge Vault', desc: 'Centralized intelligence accessible to all AI agents' },
  ]

  const workspaceTypes = [
    { value: 'personal', label: 'Personal', desc: 'For individual use', icon: '👤' },
    { value: 'family', label: 'Family', desc: 'For household management', icon: '👨‍👩‍👧‍👦' },
    { value: 'company', label: 'Company', desc: 'For team coordination', icon: '🏢' },
  ]

  const pageVariants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950 p-4">
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div key="welcome" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mb-6"
                  >
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg">
                      <Brain className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Famlyzer AI
                    </h1>
                    <p className="text-muted-foreground mt-2">Autonomous Decision & Planning Intelligence</p>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {features.map((f, i) => (
                      <motion.div
                        key={f.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="p-3 rounded-xl bg-muted/50 text-left"
                      >
                        <f.icon className="w-5 h-5 text-emerald-600 mb-1" />
                        <p className="text-sm font-medium">{f.title}</p>
                        <p className="text-xs text-muted-foreground">{f.desc}</p>
                      </motion.div>
                    ))}
                  </div>

                  <Button
                    onClick={() => setStep(1)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white h-12"
                    size="lg"
                  >
                    Get Started <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 1: Account */}
          {step === 1 && (
            <motion.div key="account" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold">Create Your Account</h2>
                    <p className="text-muted-foreground mt-1">Start your autonomous planning journey</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Email</label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11"
                        onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Name (optional)</label>
                      <Input
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-11"
                        onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleAuth}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white h-11 mt-6"
                    disabled={authMutation.isPending}
                  >
                    {authMutation.isPending ? 'Setting up...' : 'Continue'} <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>

                  <button
                    onClick={() => setStep(0)}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4"
                  >
                    ← Back
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Create Workspace */}
          {step === 2 && (
            <motion.div key="workspace" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold">Create Your Workspace</h2>
                    <p className="text-muted-foreground mt-1">Your AI-powered command center</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Workspace Name</label>
                      <Input
                        placeholder="My Family Hub"
                        value={wsName}
                        onChange={(e) => setWsName(e.target.value)}
                        className="h-11"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        {workspaceTypes.map((t) => (
                          <button
                            key={t.value}
                            onClick={() => setWsType(t.value)}
                            className={`p-3 rounded-xl border-2 transition-all text-center ${
                              wsType === t.value
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                                : 'border-border hover:border-emerald-300'
                            }`}
                          >
                            <span className="text-2xl block mb-1">{t.icon}</span>
                            <span className="text-sm font-medium block">{t.label}</span>
                            <span className="text-xs text-muted-foreground">{t.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateWorkspace}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white h-11 mt-6"
                    disabled={createWorkspaceMutation.isPending}
                  >
                    {createWorkspaceMutation.isPending ? 'Creating...' : 'Create Workspace'} <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Tutorial / Finish */}
          {step === 3 && (
            <motion.div key="tutorial" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold">You&apos;re All Set!</h2>
                    <p className="text-muted-foreground mt-1">Your workspace is ready with a 7-day trial</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    {[
                      { icon: Brain, text: 'AI agents are standing by to assist you' },
                      { icon: Shield, text: 'Financial monitoring is active' },
                      { icon: Sparkles, text: 'Start by exploring the Dashboard' },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.15 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                      >
                        <item.icon className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-sm">{item.text}</span>
                      </motion.div>
                    ))}
                  </div>

                  <Button
                    onClick={handleFinish}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white h-11"
                    size="lg"
                  >
                    Launch Famlyzer AI <Sparkles className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
