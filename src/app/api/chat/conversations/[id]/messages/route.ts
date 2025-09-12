import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { messageService } from '@/lib/chat/message-service'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/chat/conversations/{id}/messages - Get conversation messages
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const conversationId = params.id
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit')) || 50
    const offset = Number(searchParams.get('offset')) || 0
    const before = searchParams.get('before') ? new Date(searchParams.get('before')!) : undefined

    // Validate parameters
    if (!conversationId || typeof conversationId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid conversation ID' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { 
          error: 'Invalid parameters',
          details: 'Limit must be between 1 and 100'
        },
        { status: 400 }
      )
    }

    if (offset < 0) {
      return NextResponse.json(
        { 
          error: 'Invalid parameters',
          details: 'Offset must be non-negative'
        },
        { status: 400 }
      )
    }

    if (before && isNaN(before.getTime())) {
      return NextResponse.json(
        { 
          error: 'Invalid parameters',
          details: 'Invalid date format for before parameter'
        },
        { status: 400 }
      )
    }

    try {
      const result = await messageService.getConversationMessages(
        conversationId,
        session.user.id,
        { limit, offset, before }
      )

      return NextResponse.json(result)
    } catch (serviceError: any) {
      if (serviceError.message === 'User is not a participant in this conversation') {
        return NextResponse.json(
          { error: 'Access denied. You are not a participant in this conversation.' },
          { status: 403 }
        )
      }

      throw serviceError
    }
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}