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
    const { taskId, type = 'POMODORO' } = body

    // Check for existing running session
    const existingSession = await prisma.pomodoroSession.findFirst({
      where: {
        userId: session.user.id,
        status: 'RUNNING'
      }
    })

    if (existingSession) {
      return NextResponse.json({ 
        error: 'A session is already running',
        existingSession 
      }, { status: 409 })
    }

    // Get user settings for duration
    const settings = await prisma.settings.findUnique({
      where: { userId: session.user.id }
    })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    // Determine duration based on type
    let durationMinutes = 25 // default pomodoro
    if (type === 'SHORT_BREAK') {
      durationMinutes = settings?.shortBreak || 5
    } else if (type === 'LONG_BREAK') {
      durationMinutes = settings?.longBreak || 15
    } else if (type === 'POMODORO') {
      durationMinutes = settings?.pomodoroLen || 25
    }

    // Validate taskId if provided
    if (taskId) {
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          userId: session.user.id
        }
      })

      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
    }

    // Create pomodoro session
    const pomodoroSession = await prisma.pomodoroSession.create({
      data: {
        userId: session.user.id,
        taskId: taskId || null,
        startedAt: new Date(),
        status: 'RUNNING',
        type: type
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

    // Dispatch webhook for session start
    const payload = {
      event: type === 'POMODORO' ? 'pomodoro.started' : 'break.started',
      user_id: session.user.id,
      session_id: pomodoroSession.id,
      task: pomodoroSession.task ? {
        id: pomodoroSession.task.id,
        title: pomodoroSession.task.title
      } : undefined,
      start_at: pomodoroSession.startedAt.toISOString(),
      duration_planned_sec: durationMinutes * 60,
      timezone: user?.timezone || 'UTC',
      app_version: process.env.APP_VERSION || '1.0.0'
    }

    // Fire webhook asynchronously
    WebhookDispatcher.dispatch(payload, session.user.id, pomodoroSession.id)
      .catch(error => console.error('Webhook dispatch error:', error))

    return NextResponse.json({ 
      session: pomodoroSession,
      durationMinutes 
    })
  } catch (error) {
    console.error('Error starting pomodoro:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}