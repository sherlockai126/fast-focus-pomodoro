import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      }
    })

    if (!pomodoroSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Update session status
    const updatedSession = await prisma.pomodoroSession.update({
      where: { id: sessionId },
      data: {
        status: 'CANCELED',
        completedAt: new Date(),
        actualSeconds: actualSeconds || 0
      }
    })

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    console.error('Error canceling pomodoro:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}