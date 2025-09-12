import { PrismaClient, MessageType, MessageStatus } from '@prisma/client'

const prisma = new PrismaClient()

export interface MessageData {
  id: string
  content: string
  type: MessageType
  status: MessageStatus
  createdAt: Date
  updatedAt: Date
  editedAt: Date | null
  conversationId: string
  senderId: string
  sender: {
    id: string
    name: string | null
    email: string
    isOnline: boolean
  }
}

export interface CreateMessageData {
  conversationId: string
  content: string
  type?: MessageType
}

export class MessageService {
  async getConversationMessages(
    conversationId: string,
    userId: string,
    options: {
      limit?: number
      offset?: number
      before?: Date
    } = {}
  ): Promise<{
    messages: MessageData[]
    total: number
    hasMore: boolean
  }> {
    const { limit = 50, offset = 0, before } = options

    // Verify user is participant in conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId
      }
    })

    if (!participant) {
      throw new Error('User is not a participant in this conversation')
    }

    const whereClause: any = {
      conversationId
    }

    if (before) {
      whereClause.createdAt = {
        lt: before
      }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            isOnline: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit + 1 // Take one extra to check if there are more
    })

    const hasMore = messages.length > limit
    const result = messages.slice(0, limit).reverse() // Reverse to get chronological order

    const total = await prisma.message.count({
      where: whereClause
    })

    return {
      messages: result,
      total,
      hasMore
    }
  }

  async createMessage(
    senderId: string,
    data: CreateMessageData
  ): Promise<MessageData> {
    // Verify sender is participant in conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: data.conversationId,
        userId: senderId
      }
    })

    if (!participant) {
      throw new Error('User is not a participant in this conversation')
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId,
        content: data.content.trim(),
        type: data.type || 'TEXT',
        status: 'SENT'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            isOnline: true
          }
        }
      }
    })

    // Update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: {
        lastMessageAt: message.createdAt,
        updatedAt: new Date()
      }
    })

    return message
  }

  async updateMessage(
    messageId: string,
    userId: string,
    updates: {
      content?: string
      status?: MessageStatus
    }
  ): Promise<MessageData | null> {
    // Get current message and verify ownership
    const currentMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            isOnline: true
          }
        }
      }
    })

    if (!currentMessage) {
      return null
    }

    // Only sender can edit content, anyone can update status
    if (updates.content && currentMessage.senderId !== userId) {
      throw new Error('Only the message sender can edit content')
    }

    const updateData: any = {}
    
    if (updates.content) {
      updateData.content = updates.content.trim()
      updateData.editedAt = new Date()
    }
    
    if (updates.status) {
      updateData.status = updates.status
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: updateData,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            isOnline: true
          }
        }
      }
    })

    return updatedMessage
  }

  async markMessageAsRead(
    messageId: string,
    userId: string
  ): Promise<MessageData | null> {
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    })

    if (!message) {
      return null
    }

    // Verify user is participant in the conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: message.conversationId,
        userId
      }
    })

    if (!participant) {
      throw new Error('User is not a participant in this conversation')
    }

    // Update the participant's lastReadAt to this message's timestamp
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: message.conversationId,
        userId
      },
      data: {
        lastReadAt: message.createdAt
      }
    })

    // If the message is not sent by the user, mark it as read
    if (message.senderId !== userId) {
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: { status: 'READ' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              isOnline: true
            }
          }
        }
      })
      
      return updatedMessage
    }

    // Return message with sender info
    const messageWithSender = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            isOnline: true
          }
        }
      }
    })

    return messageWithSender
  }

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    })

    if (!message) {
      return false
    }

    // Only sender can delete message
    if (message.senderId !== userId) {
      throw new Error('Only the message sender can delete the message')
    }

    await prisma.message.delete({
      where: { id: messageId }
    })

    return true
  }

  async searchMessages(
    userId: string,
    query: string,
    conversationId?: string,
    options: {
      limit?: number
      offset?: number
    } = {}
  ): Promise<{
    messages: MessageData[]
    total: number
  }> {
    const { limit = 50, offset = 0 } = options

    // Build where clause
    const whereClause: any = {
      content: {
        contains: query,
        mode: 'insensitive'
      },
      conversation: {
        participants: {
          some: {
            userId
          }
        }
      }
    }

    if (conversationId) {
      whereClause.conversationId = conversationId
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            isOnline: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit
    })

    const total = await prisma.message.count({
      where: whereClause
    })

    return {
      messages,
      total
    }
  }
}

export const messageService = new MessageService()