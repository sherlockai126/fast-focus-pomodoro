import { beforeAll, afterAll, beforeEach } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

// Test database configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
})

// Test setup and teardown
beforeAll(async () => {
  // Connect to test database
  await prisma.$connect()
  
  // Run migrations in test environment
  // Note: In production, use a separate test database
  console.log('Test database connected')
})

afterAll(async () => {
  // Clean up and disconnect
  await prisma.$disconnect()
})

// Clean up data between tests
beforeEach(async () => {
  // Clear chat data for clean tests
  await prisma.message.deleteMany()
  await prisma.conversationParticipant.deleteMany() 
  await prisma.conversation.deleteMany()
  
  // Reset user chat fields
  await prisma.user.updateMany({
    data: {
      isOnline: false,
      lastSeenAt: null,
      chatStatus: 'AVAILABLE'
    }
  })
})

// Export test utilities
export { prisma }

export const createTestUser = async (data: {
  email: string
  name?: string
  isOnline?: boolean
}) => {
  return await prisma.user.create({
    data: {
      id: `test-${Date.now()}-${Math.random()}`,
      email: data.email,
      name: data.name || 'Test User',
      isOnline: data.isOnline || false,
      chatStatus: 'AVAILABLE'
    }
  })
}

export const createTestConversation = async (
  user1Id: string, 
  user2Id: string,
  type: 'DIRECT' | 'GROUP' = 'DIRECT'
) => {
  const conversation = await prisma.conversation.create({
    data: {
      type,
      participants: {
        create: [
          { userId: user1Id },
          { userId: user2Id }
        ]
      }
    },
    include: {
      participants: true
    }
  })
  
  return conversation
}

export const createTestMessage = async (data: {
  conversationId: string
  senderId: string
  content: string
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
}) => {
  return await prisma.message.create({
    data: {
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: data.content,
      type: data.type || 'TEXT',
      status: 'SENT'
    }
  })
}