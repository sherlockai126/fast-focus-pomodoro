import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { conversationService } from '@/lib/chat/conversation-service'
import { ConversationType } from '@prisma/client'

// GET /api/chat/conversations - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit')) || 20
    const offset = Number(searchParams.get('offset')) || 0

    // Validate parameters
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

    const result = await conversationService.getUserConversations(
      session.user.id,
      { limit, offset }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/chat/conversations - Create new conversation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, participantId, participantIds, name } = body

    // Validate payload
    if (!type || !['DIRECT', 'GROUP'].includes(type)) {
      return NextResponse.json(
        {
          error: 'Invalid payload',
          details: 'type is required and must be DIRECT or GROUP'
        },
        { status: 400 }
      )
    }

    if (type === 'DIRECT' && !participantId) {
      return NextResponse.json(
        {
          error: 'Invalid payload',
          details: 'participantId is required for DIRECT conversations'
        },
        { status: 400 }
      )
    }

    if (type === 'GROUP' && (!name || !participantIds || !Array.isArray(participantIds) || participantIds.length === 0)) {
      return NextResponse.json(
        {
          error: 'Invalid payload',
          details: 'name and participantIds array are required for GROUP conversations'
        },
        { status: 400 }
      )
    }

    // Prevent self-conversation
    if (type === 'DIRECT' && participantId === session.user.id) {
      return NextResponse.json(
        {
          error: 'Invalid payload',
          details: 'Cannot create conversation with yourself'
        },
        { status: 400 }
      )
    }

    if (type === 'GROUP' && participantIds.includes(session.user.id)) {
      return NextResponse.json(
        {
          error: 'Invalid payload',
          details: 'Cannot include yourself in participantIds'
        },
        { status: 400 }
      )
    }

    try {
      const conversation = await conversationService.createConversation(
        session.user.id,
        {
          type: type as ConversationType,
          participantId,
          participantIds,
          name
        }
      )

      return NextResponse.json(conversation, { status: 201 })
    } catch (serviceError: any) {
      if (serviceError.message === 'Direct conversation already exists between these users') {
        return NextResponse.json(
          { error: 'Conversation already exists between these users' },
          { status: 409 }
        )
      }

      if (serviceError.message === 'User not found') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      if (serviceError.message.includes('not found')) {
        return NextResponse.json(
          { error: 'One or more participants not found' },
          { status: 404 }
        )
      }

      throw serviceError // Re-throw for generic error handling
    }
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}