import { PrismaClient, ConversationType } from '@prisma/client'

const prisma = new PrismaClient()

export interface ConversationSummary {
  id: string
  type: ConversationType
  name: string | null
  lastMessage?: {
    id: string
    content: string
    senderId: string
    createdAt: Date
    sender: {
      id: string
      name: string | null
    }
  } | null
  lastMessageAt: Date | null
  unreadCount: number
  participants: Array<{
    userId: string
    user: {
      id: string
      name: string | null
      email: string
      isOnline: boolean
      chatStatus: string
    }
  }>
  createdAt: Date
  updatedAt: Date
}

export interface CreateConversationData {
  type: ConversationType
  name?: string
  participantId?: string // For DIRECT conversations
  participantIds?: string[] // For GROUP conversations
}

export class ConversationService {
  async getUserConversations(
    userId: string,
    options: {
      limit?: number
      offset?: number
    } = {}
  ): Promise<{
    conversations: ConversationSummary[]
    total: number
    hasMore: boolean
  }> {
    const { limit = 20, offset = 0 } = options

    // Get conversations where user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isOnline: true,
                chatStatus: true
              }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      },
      skip: offset,
      take: limit + 1 // Take one extra to check if there are more
    })

    const hasMore = conversations.length > limit
    const result = conversations.slice(0, limit)

    // Get total count
    const total = await prisma.conversation.count({
      where: {
        participants: {
          some: {
            userId
          }
        }
      }
    })

    // Calculate unread counts
    const conversationsWithUnreadCount = await Promise.all(
      result.map(async (conversation) => {
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId: conversation.id,
            userId
          }
        })

        let unreadCount = 0
        if (participant) {
          unreadCount = await prisma.message.count({
            where: {
              conversationId: conversation.id,
              createdAt: {
                gt: participant.lastReadAt || participant.joinedAt
              },
              senderId: {
                not: userId
              }
            }
          })
        }

        return {
          id: conversation.id,
          type: conversation.type,
          name: conversation.name,
          lastMessage: conversation.messages[0] || null,
          lastMessageAt: conversation.lastMessageAt,
          unreadCount,
          participants: conversation.participants,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt
        }
      })
    )

    return {
      conversations: conversationsWithUnreadCount,
      total,
      hasMore
    }
  }

  async getConversationById(
    conversationId: string,
    userId: string
  ): Promise<ConversationSummary | null> {
    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId
      }
    })

    if (!participant) {
      return null
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isOnline: true,
                chatStatus: true
              }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (!conversation) {
      return null
    }

    // Calculate unread count
    const unreadCount = await prisma.message.count({
      where: {
        conversationId: conversation.id,
        createdAt: {
          gt: participant.lastReadAt || participant.joinedAt
        },
        senderId: {
          not: userId
        }
      }
    })

    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      lastMessage: conversation.messages[0] || null,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount,
      participants: conversation.participants,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    }
  }

  async createConversation(
    creatorId: string,
    data: CreateConversationData
  ): Promise<ConversationSummary> {
    if (data.type === 'DIRECT') {
      if (!data.participantId) {
        throw new Error('participantId is required for DIRECT conversations')
      }

      // Check if conversation already exists
      const existing = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          participants: {
            every: {
              userId: {
                in: [creatorId, data.participantId]
              }
            }
          }
        }
      })

      if (existing) {
        throw new Error('Direct conversation already exists between these users')
      }

      // Verify participant exists
      const participant = await prisma.user.findUnique({
        where: { id: data.participantId }
      })
      if (!participant) {
        throw new Error('User not found')
      }

      const conversation = await prisma.conversation.create({
        data: {
          type: 'DIRECT',
          participants: {
            create: [
              { userId: creatorId },
              { userId: data.participantId }
            ]
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  isOnline: true,
                  chatStatus: true
                }
              }
            }
          }
        }
      })

      return {
        id: conversation.id,
        type: conversation.type,
        name: conversation.name,
        lastMessage: null,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount: 0,
        participants: conversation.participants,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    } else if (data.type === 'GROUP') {
      if (!data.name || !data.participantIds?.length) {
        throw new Error('name and participantIds are required for GROUP conversations')
      }

      // Verify all participants exist
      const participants = await prisma.user.findMany({
        where: {
          id: {
            in: data.participantIds
          }
        }
      })

      if (participants.length !== data.participantIds.length) {
        throw new Error('One or more participants not found')
      }

      const conversation = await prisma.conversation.create({
        data: {
          type: 'GROUP',
          name: data.name,
          participants: {
            create: [
              { userId: creatorId },
              ...data.participantIds.map(id => ({ userId: id }))
            ]
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  isOnline: true,
                  chatStatus: true
                }
              }
            }
          }
        }
      })

      return {
        id: conversation.id,
        type: conversation.type,
        name: conversation.name,
        lastMessage: null,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount: 0,
        participants: conversation.participants,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    } else {
      throw new Error('Invalid conversation type')
    }
  }

  async updateLastReadAt(conversationId: string, userId: string): Promise<void> {
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId
      },
      data: {
        lastReadAt: new Date()
      }
    })
  }
}

export const conversationService = new ConversationService()