import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface LocalSession {
  id: string
  type: 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK'
  startedAt: string
  completedAt?: string
  duration: number
  taskTitle?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { sessions }: { sessions: LocalSession[] } = await request.json()
    
    if (!sessions || !Array.isArray(sessions)) {
      return NextResponse.json(
        { error: 'Invalid sessions data' },
        { status: 400 }
      )
    }

    let migratedCount = 0

    // Process each session
    for (const localSession of sessions) {
      try {
        // Create task if it has a title
        let taskId = null
        if (localSession.taskTitle && localSession.type === 'POMODORO') {
          const task = await prisma.task.create({
            data: {
              title: localSession.taskTitle,
              userId: session.user.id,
              status: 'COMPLETED',
              priority: 'MEDIUM',
              pomodoroEstimate: 1,
              completedAt: localSession.completedAt ? new Date(localSession.completedAt) : null
            }
          })
          taskId = task.id
        }

        // Create pomodoro session
        await prisma.pomodoroSession.create({
          data: {
            userId: session.user.id,
            taskId: taskId,
            type: localSession.type,
            status: localSession.completedAt ? 'COMPLETED' : 'CANCELED',
            startedAt: new Date(localSession.startedAt),
            completedAt: localSession.completedAt ? new Date(localSession.completedAt) : null,
            actualSeconds: localSession.duration
          }
        })

        migratedCount++
      } catch (error) {
        console.error('Error migrating session:', error)
        // Continue with other sessions even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      migrated: migratedCount,
      total: sessions.length
    })
  } catch (error) {
    console.error('Error in session migration:', error)
    return NextResponse.json(
      { error: 'Failed to migrate sessions' },
      { status: 500 }
    )
  }
}