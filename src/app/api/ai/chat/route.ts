import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireWorkspaceAccess } from '@/lib/auth-guard'
import { db } from '@/lib/db'
import { SYSTEM_PROMPT, aiChat } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const auth = await requireAuth(request)

    const body = await request.json()
    const { messages, workspaceId, context } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    // Workspace-scoped operations: require workspace access verification
    let workspace: Awaited<ReturnType<typeof requireWorkspaceAccess>>['workspace'] | null = null
    if (workspaceId) {
      const workspaceAccess = await requireWorkspaceAccess(request, workspaceId)
      workspace = workspaceAccess.workspace
    }

    let contextStr = ''
    if (workspace) {
      // Fetch workspace with members for context
      const workspaceWithMembers = await db.workspace.findUnique({
        where: { id: workspace.id },
        include: {
          members: { include: { user: { select: { name: true, email: true } } } },
        },
      })
      if (workspaceWithMembers) {
        contextStr = `\n\nCurrent Workspace: ${workspaceWithMembers.name} (Type: ${workspaceWithMembers.type}, Autonomous Level: ${workspaceWithMembers.autonomousLevel})`
        contextStr += `\nMembers: ${workspaceWithMembers.members.map((m) => `${m.alias || m.user.name} (${m.role}, Energy: ${m.energyLevel}, Stress: ${m.stressLevel})`).join(', ')}`
      }

      if (context) {
        contextStr += `\n\nAdditional Context: ${context}`
      }
    }

    const systemMessage = {
      role: 'system' as const,
      content: SYSTEM_PROMPT + contextStr,
    }

    const allMessages = [systemMessage, ...messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))]

    const reply = await aiChat(allMessages)

    // Only create memory entry for workspace-scoped operations
    if (workspace) {
      await db.memory.create({
        data: {
          workspaceId: workspace.id,
          layer: 'short_term',
          category: 'chat',
          content: `Chat: ${messages[messages.length - 1]?.content?.substring(0, 100)}... -> ${reply.substring(0, 200)}`,
          importance: 3,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })
    }

    return NextResponse.json({ reply })
  } catch (error) {
    // If requireAuth or requireWorkspaceAccess threw a NextResponse, return it
    if (error instanceof NextResponse) {
      return error
    }
    console.error('AI chat error:', error)
    return NextResponse.json({ error: 'Failed to process AI chat' }, { status: 500 })
  }
}
