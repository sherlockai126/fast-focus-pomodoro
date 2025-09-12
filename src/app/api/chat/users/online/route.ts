import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { userPresenceService } from '@/lib/chat/user-presence-service'

// GET /api/chat/users/online - Get online users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const onlineUsers = await userPresenceService.getOnlineUsers()
    
    // Filter out current user
    const filteredUsers = onlineUsers.filter(user => user.id !== session.user.id)

    return NextResponse.json({
      users: filteredUsers,
      count: filteredUsers.length,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Error fetching online users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}