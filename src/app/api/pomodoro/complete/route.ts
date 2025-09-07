import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WebhookDispatcher } from '@/lib/webhook'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, actualSeconds } = body

    // Find the running session
    const pomodoroSession = await prisma.pomodoroSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
        status: 'RUNNING'
      },
      include: {
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!pomodoroSession) {
      return NextResponse.json({ error: 'Session not found or not running' }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    const settings = await prisma.settings.findUnique({
      where: { userId: session.user.id }
    })

    // Calculate planned duration
    let plannedMinutes = 25
    if (pomodoroSession.type === 'SHORT_BREAK') {
      plannedMinutes = settings?.shortBreak || 5
    } else if (pomodoroSession.type === 'LONG_BREAK') {
      plannedMinutes = settings?.longBreak || 15
    } else {
      plannedMinutes = settings?.pomodoroLen || 25
    }

    // Update session
    const completedSession = await prisma.pomodoroSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endAt: new Date(),
        actualSec: actualSeconds
      },
      include: {
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    // Dispatch webhook for completion
    const payload = {
      event: pomodoroSession.type === 'POMODORO' ? 'pomodoro.completed' : 'break.completed',
      user_id: session.user.id,
      session_id: sessionId,
      task: pomodoroSession.task ? {
        id: pomodoroSession.task.id,
        title: pomodoroSession.task.title
      } : undefined,
      start_at: pomodoroSession.startAt.toISOString(),
      end_at: completedSession.endAt!.toISOString(),
      duration_planned_sec: plannedMinutes * 60,
      duration_actual_sec: actualSeconds,
      timezone: user?.timezone || 'UTC',
      app_version: process.env.APP_VERSION || '1.0.0'
    }

    // Fire webhook asynchronously
    WebhookDispatcher.dispatch(payload, session.user.id, sessionId)
      .catch(error => console.error('Webhook dispatch error:', error))

    return NextResponse.json({ 
      session: completedSession
    })
  } catch (error) {
    console.error('Error completing pomodoro:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}