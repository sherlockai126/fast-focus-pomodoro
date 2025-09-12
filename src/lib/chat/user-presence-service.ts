import { PrismaClient, ChatStatus } from '@prisma/client'

const prisma = new PrismaClient()

export interface UserPresence {
  id: string
  name: string | null
  email: string
  isOnline: boolean
  lastSeenAt: Date | null
  chatStatus: ChatStatus
}

export class UserPresenceService {
  async setUserOnline(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: true,
        lastSeenAt: new Date()
      }
    })
  }

  async setUserOffline(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: false,
        lastSeenAt: new Date()
      }
    })
  }

  async updateUserActivity(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastSeenAt: new Date()
      }
    })
  }

  async updateChatStatus(userId: string, status: ChatStatus): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        chatStatus: status
      }
    })
  }

  async getUserPresence(userId: string): Promise<UserPresence | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isOnline: true,
        lastSeenAt: true,
        chatStatus: true
      }
    })

    return user
  }

  async getOnlineUsers(): Promise<UserPresence[]> {
    const users = await prisma.user.findMany({
      where: {
        isOnline: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        isOnline: true,
        lastSeenAt: true,
        chatStatus: true
      },
      orderBy: {
        lastSeenAt: 'desc'
      }
    })

    return users
  }

  async searchUsers(
    query: string,
    currentUserId: string,
    options: {
      limit?: number
      offset?: number
      onlineOnly?: boolean
    } = {}
  ): Promise<{
    users: UserPresence[]
    total: number
  }> {
    const { limit = 20, offset = 0, onlineOnly = false } = options

    const whereClause: any = {
      AND: [
        {
          id: {
            not: currentUserId // Exclude current user
          }
        },
        {
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              email: {
                contains: query,
                mode: 'insensitive'
              }
            }
          ]
        }
      ]
    }

    if (onlineOnly) {
      whereClause.AND.push({
        isOnline: true
      })
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        isOnline: true,
        lastSeenAt: true,
        chatStatus: true
      },
      orderBy: [
        { isOnline: 'desc' },
        { lastSeenAt: 'desc' }
      ],
      skip: offset,
      take: limit
    })

    const total = await prisma.user.count({
      where: whereClause
    })

    return {
      users,
      total
    }
  }

  async getConversationParticipantsPresence(
    conversationId: string,
    currentUserId: string
  ): Promise<UserPresence[]> {
    const participants = await prisma.conversationParticipant.findMany({
      where: {
        conversationId,
        userId: {
          not: currentUserId // Exclude current user
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isOnline: true,
            lastSeenAt: true,
            chatStatus: true
          }
        }
      }
    })

    return participants.map(p => p.user)
  }

  // Cleanup offline users (run periodically)
  async cleanupOfflineUsers(thresholdMinutes: number = 5): Promise<number> {
    const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000)
    
    const result = await prisma.user.updateMany({
      where: {
        isOnline: true,
        lastSeenAt: {
          lt: threshold
        }
      },
      data: {
        isOnline: false
      }
    })

    return result.count
  }

  // Typing indicators (temporary state - could use Redis in production)
  private typingUsers = new Map<string, Set<string>>() // conversationId -> Set of userIds

  async setTyping(conversationId: string, userId: string): Promise<void> {
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set())
    }
    
    this.typingUsers.get(conversationId)!.add(userId)
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      this.removeTyping(conversationId, userId)
    }, 10000)
  }

  async removeTyping(conversationId: string, userId: string): Promise<void> {
    const typingSet = this.typingUsers.get(conversationId)
    if (typingSet) {
      typingSet.delete(userId)
      if (typingSet.size === 0) {
        this.typingUsers.delete(conversationId)
      }
    }
  }

  async getTypingUsers(conversationId: string): Promise<string[]> {
    const typingSet = this.typingUsers.get(conversationId)
    return typingSet ? Array.from(typingSet) : []
  }
}

export const userPresenceService = new UserPresenceService()