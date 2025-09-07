import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma, Priority } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    const whereClause: Prisma.TaskWhereInput = { userId: session.user.id }
    
    if (status && status !== 'ALL') {
      whereClause.status = status as Prisma.EnumTaskStatusFilter
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
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
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
    const { taskText } = body

    if (!taskText) {
      return NextResponse.json({ error: 'Task text is required' }, { status: 400 })
    }

    // Parse task text for tags, priority, and estimate
    const tagMatches = taskText.match(/#(\w+)/g) || []
    const tags = tagMatches.map((tag: string) => tag.slice(1))
    
    const priorityMatch = taskText.match(/!(high|medium|low)/i)
    let priority: Priority = 'MEDIUM'
    if (priorityMatch) {
      priority = priorityMatch[1].toUpperCase() as Priority
    }
    
    const estimateMatch = taskText.match(/~(\d+)/)
    const estimate = estimateMatch ? parseInt(estimateMatch[1]) : 1
    
    // Clean title by removing syntax
    const title = taskText
      .replace(/#\w+/g, '')
      .replace(/!(high|medium|low)/gi, '')
      .replace(/~\d+/g, '')
      .trim()

    if (!title) {
      return NextResponse.json({ error: 'Task title cannot be empty' }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        title,
        priority,
        estimate,
        tags: JSON.stringify(tags),
        status: 'TODO'
      }
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}