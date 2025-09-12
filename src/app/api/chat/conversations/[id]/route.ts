import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { conversationService } from '@/lib/chat/conversation-service'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/chat/conversations/{id} - Get conversation details
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

    if (!conversationId || typeof conversationId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid conversation ID' },
        { status: 400 }
      )
    }

    const conversation = await conversationService.getConversationById(
      conversationId,
      session.user.id
    )

    if (!conversation) {
      // Check if conversation exists but user is not a participant
      const exists = await conversationService.getConversationById(conversationId, 'dummy-user-id')
      
      if (exists) {
        return NextResponse.json(
          { error: 'Access denied. You are not a participant in this conversation.' },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}