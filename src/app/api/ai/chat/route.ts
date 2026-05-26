import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SYSTEM_PROMPT, aiChat } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, workspaceId, context } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    let contextStr = ''
    if (workspaceId) {
      const workspace = await db.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          members: { include: { user: { select: { name: true, email: true } } } },
        },
      })
      if (workspace) {
        contextStr = `\n\nCurrent Workspace: ${workspace.name} (Type: ${workspace.type}, Autonomous Level: ${workspace.autonomousLevel})`
        contextStr += `\nMembers: ${workspace.members.map((m) => `${m.alias || m.user.name} (${m.role}, Energy: ${m.energyLevel}, Stress: ${m.stressLevel})`).join(', ')}`
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

    if (workspaceId) {
      await db.memory.create({
        data: {
          workspaceId,
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
    console.error('AI chat error:', error)
    return NextResponse.json({ error: 'Failed to process AI chat' }, { status: 500 })
  }
}
