import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { userPresenceService } from './user-presence-service'
import { messageService } from './message-service'
import { conversationService } from './conversation-service'

interface AuthenticatedSocket extends Socket {
  userId: string
}

export class ChatSocketServer {
  private io: SocketIOServer
  private connectedUsers = new Map<string, string>() // userId -> socketId

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      path: '/api/socket.io',
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    })

    this.setupNamespace()
  }

  private setupNamespace() {
    // Chat namespace
    const chatNamespace = this.io.of('/chat')

    // Authentication middleware
    chatNamespace.use(async (socket, next) => {
      try {
        const userId = socket.handshake.auth.userId
        
        if (!userId) {
          return next(new Error('Authentication failed: userId required'))
        }

        // Verify user exists and is valid
        const userPresence = await userPresenceService.getUserPresence(userId)
        if (!userPresence) {
          return next(new Error('Authentication failed: invalid user'))
        }

        ;(socket as AuthenticatedSocket).userId = userId
        next()
      } catch (error) {
        next(new Error('Authentication failed'))
      }
    })

    // Connection handling
    chatNamespace.on('connection', async (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected to chat`)

      // Set user online
      await userPresenceService.setUserOnline(socket.userId)
      this.connectedUsers.set(socket.userId, socket.id)

      // Emit user connected event
      socket.emit('user_connected', {
        userId: socket.userId,
        timestamp: new Date()
      })

      // Join user to their personal room for direct messages
      socket.join(`user:${socket.userId}`)

      this.setupSocketHandlers(socket, chatNamespace)

      // Handle disconnection
      socket.on('disconnect', async (reason) => {
        console.log(`User ${socket.userId} disconnected: ${reason}`)
        
        await userPresenceService.setUserOffline(socket.userId)
        this.connectedUsers.delete(socket.userId)
        
        // Clear typing indicators for this user
        // Note: In production, you might want to broadcast typing_stop events
        
        socket.emit('user_disconnected', {
          userId: socket.userId,
          timestamp: new Date()
        })
      })
    })
  }

  private setupSocketHandlers(socket: AuthenticatedSocket, namespace: any) {
    // Join conversation room
    socket.on('join_conversation', async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data

        // Verify user is participant in conversation
        const conversation = await conversationService.getConversationById(
          conversationId,
          socket.userId
        )

        if (!conversation) {
          socket.emit('error', {
            event: 'join_conversation',
            message: 'Access denied or conversation not found'
          })
          return
        }

        // Join the conversation room
        socket.join(`conversation:${conversationId}`)
        
        socket.emit('conversation_joined', {
          conversationId,
          timestamp: new Date()
        })

        // Notify other participants that user joined
        socket.to(`conversation:${conversationId}`).emit('user_joined_conversation', {
          conversationId,
          userId: socket.userId,
          timestamp: new Date()
        })
      } catch (error) {
        console.error('Error joining conversation:', error)
        socket.emit('error', {
          event: 'join_conversation',
          message: 'Failed to join conversation'
        })
      }
    })

    // Leave conversation room
    socket.on('leave_conversation', async (data: { conversationId: string }) => {
      const { conversationId } = data
      socket.leave(`conversation:${conversationId}`)
      
      socket.emit('conversation_left', {
        conversationId,
        timestamp: new Date()
      })

      // Notify other participants
      socket.to(`conversation:${conversationId}`).emit('user_left_conversation', {
        conversationId,
        userId: socket.userId,
        timestamp: new Date()
      })
    })

    // Send message
    socket.on('send_message', async (data: {
      conversationId: string
      content: string
      type?: 'TEXT' | 'IMAGE' | 'FILE'
    }) => {
      try {
        const { conversationId, content, type } = data

        if (!content || !content.trim()) {
          socket.emit('error', {
            event: 'send_message',
            message: 'Message content is required'
          })
          return
        }

        // Create message
        const message = await messageService.createMessage(socket.userId, {
          conversationId,
          content: content.trim(),
          type: type || 'TEXT'
        })

        // Broadcast to conversation room
        namespace.to(`conversation:${conversationId}`).emit('message_received', {
          id: message.id,
          conversationId: message.conversationId,
          content: message.content,
          type: message.type,
          status: message.status,
          senderId: message.senderId,
          sender: message.sender,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          editedAt: message.editedAt
        })

        // Stop typing indicator for sender
        await userPresenceService.removeTyping(conversationId, socket.userId)
        socket.to(`conversation:${conversationId}`).emit('typing_stop', {
          conversationId,
          userId: socket.userId
        })

      } catch (error: any) {
        console.error('Error sending message:', error)
        socket.emit('error', {
          event: 'send_message',
          message: error.message || 'Failed to send message'
        })
      }
    })

    // Typing indicators
    socket.on('typing_start', async (data: { conversationId: string }) => {
      const { conversationId } = data
      
      await userPresenceService.setTyping(conversationId, socket.userId)
      
      socket.to(`conversation:${conversationId}`).emit('typing_start', {
        conversationId,
        userId: socket.userId,
        timestamp: new Date()
      })
    })

    socket.on('typing_stop', async (data: { conversationId: string }) => {
      const { conversationId } = data
      
      await userPresenceService.removeTyping(conversationId, socket.userId)
      
      socket.to(`conversation:${conversationId}`).emit('typing_stop', {
        conversationId,
        userId: socket.userId,
        timestamp: new Date()
      })
    })

    // Message status updates
    socket.on('mark_message_read', async (data: { messageId: string }) => {
      try {
        const { messageId } = data
        
        const message = await messageService.markMessageAsRead(messageId, socket.userId)
        
        if (message) {
          // Notify sender that message was read
          const senderSocketId = this.connectedUsers.get(message.senderId)
          if (senderSocketId) {
            namespace.to(senderSocketId).emit('message_status_updated', {
              messageId: message.id,
              status: 'READ',
              readBy: socket.userId,
              timestamp: new Date()
            })
          }
        }
      } catch (error) {
        console.error('Error marking message as read:', error)
        socket.emit('error', {
          event: 'mark_message_read',
          message: 'Failed to mark message as read'
        })
      }
    })

    // Presence updates
    socket.on('update_chat_status', async (data: { status: 'AVAILABLE' | 'BUSY' | 'AWAY' }) => {
      try {
        const { status } = data
        
        await userPresenceService.updateChatStatus(socket.userId, status)
        
        // Broadcast status change to relevant users
        // In practice, you might want to only broadcast to conversation participants
        socket.broadcast.emit('user_status_changed', {
          userId: socket.userId,
          status,
          timestamp: new Date()
        })
      } catch (error) {
        console.error('Error updating chat status:', error)
        socket.emit('error', {
          event: 'update_chat_status',
          message: 'Failed to update status'
        })
      }
    })

    // Heartbeat to keep connection alive and update activity
    socket.on('ping', async () => {
      await userPresenceService.updateUserActivity(socket.userId)
      socket.emit('pong', { timestamp: new Date() })
    })
  }

  // Utility methods for external use
  public emitToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId)
    if (socketId) {
      this.io.to(socketId).emit(event, data)
    }
  }

  public emitToConversation(conversationId: string, event: string, data: any) {
    this.io.of('/chat').to(`conversation:${conversationId}`).emit(event, data)
  }

  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId)
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys())
  }
}

// Singleton instance
let chatServer: ChatSocketServer | null = null

export const initializeChatSocket = (httpServer: HTTPServer): ChatSocketServer => {
  if (!chatServer) {
    chatServer = new ChatSocketServer(httpServer)
  }
  return chatServer
}

export const getChatSocket = (): ChatSocketServer | null => {
  return chatServer
}