import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { userPresenceService } from '@/lib/chat/user-presence-service'

// GET /api/chat/users/search - Search for users
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
    const query = searchParams.get('q') || ''
    const limit = Number(searchParams.get('limit')) || 20
    const offset = Number(searchParams.get('offset')) || 0
    const onlineOnly = searchParams.get('online') === 'true'

    // Validate parameters
    if (query.length < 2) {
      return NextResponse.json(
        { 
          error: 'Invalid parameters',
          details: 'Search query must be at least 2 characters'
        },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { 
          error: 'Invalid parameters',
          details: 'Limit must be between 1 and 50'
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

    const result = await userPresenceService.searchUsers(
      query,
      session.user.id,
      { limit, offset, onlineOnly }
    )

    return NextResponse.json({
      users: result.users,
      total: result.total,
      query,
      hasMore: result.total > offset + result.users.length
    })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}