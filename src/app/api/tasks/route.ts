import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Priority } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') // all, today, completed
    const search = searchParams.get('search')
    
    const whereClause: Record<string, unknown> = {
      userId: session.user.id
    }

    if (filter === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      whereClause.OR = [
        { dueAt: { gte: today, lt: tomorrow } },
        { dueAt: null, status: 'TODO' } // Include tasks without due date
      ]
    } else if (filter === 'completed') {
      whereClause.status = 'DONE'
    } else if (filter === 'todo') {
      whereClause.status = 'TODO'
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        pomodoroSessions: {
          where: { status: 'COMPLETED' },
          select: { id: true }
        }
      }
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, notes, priority = 'MEDIUM', tags = [], estimate = 1, dueAt } = body

    // Parse quick syntax from title if present
    let parsedTitle = title
    let parsedPriority = priority as Priority
    let parsedTags = tags as string[]
    let parsedEstimate = estimate

    // Extract #tags
    const tagMatches = title.match(/#(\w+)/g)
    if (tagMatches) {
      parsedTags = [...parsedTags, ...tagMatches.map((tag: string) => tag.substring(1))]
      parsedTitle = title.replace(/#\w+/g, '').trim()
    }

    // Extract !priority
    const priorityMatch = title.match(/!(low|medium|high)/i)
    if (priorityMatch) {
      parsedPriority = priorityMatch[1].toUpperCase() as Priority
      parsedTitle = title.replace(/!(low|medium|high)/gi, '').trim()
    }

    // Extract ~estimate
    const estimateMatch = title.match(/~(\d+)/)
    if (estimateMatch) {
      parsedEstimate = parseInt(estimateMatch[1])
      parsedTitle = title.replace(/~\d+/g, '').trim()
    }

    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        title: parsedTitle,
        notes,
        priority: parsedPriority,
        tags: JSON.stringify(parsedTags),
        estimate: parsedEstimate,
        dueAt: dueAt ? new Date(dueAt) : null
      }
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}