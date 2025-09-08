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

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Find and update the session
    const pomodoroSession = await prisma.pomodoroSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
        status: 'RUNNING'
      },
      include: {
        task: true
      }
    })

    if (!pomodoroSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Update session status
    const updatedSession = await prisma.pomodoroSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        actualSeconds: actualSeconds || Math.floor((Date.now() - pomodoroSession.startedAt.getTime()) / 1000)
      },
      include: {
        task: true
      }
    })

    // Get user for timezone and settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        settings: true
      }
    })

    // Get duration based on session type and user settings
    let durationPlannedSec = 1500 // default 25 minutes
    if (user?.settings) {
      switch (pomodoroSession.type) {
        case 'POMODORO':
          durationPlannedSec = (user.settings.pomodoroLen || 25) * 60
          break
        case 'SHORT_BREAK':
          durationPlannedSec = (user.settings.shortBreak || 5) * 60
          break
        case 'LONG_BREAK':
          durationPlannedSec = (user.settings.longBreak || 15) * 60
          break
      }
    }

    // Dispatch webhook for session completion
    const payload = {
      event: pomodoroSession.type === 'POMODORO' ? 'pomodoro.completed' : 'break.completed',
      user_id: session.user.id,
      session_id: updatedSession.id,
      task: updatedSession.task ? {
        id: updatedSession.task.id,
        title: updatedSession.task.title
      } : undefined,
      start_at: updatedSession.startedAt.toISOString(),
      end_at: updatedSession.completedAt?.toISOString(),
      duration_planned_sec: durationPlannedSec,
      duration_actual_sec: updatedSession.actualSeconds,
      timezone: user?.timezone || 'UTC',
      app_version: process.env.APP_VERSION || '1.0.0'
    }

    // Fire webhook asynchronously
    WebhookDispatcher.dispatch(payload, session.user.id, updatedSession.id)
      .catch(error => console.error('Webhook dispatch error:', error))

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    console.error('Error completing pomodoro:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}