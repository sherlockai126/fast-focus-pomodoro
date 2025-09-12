'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

// Types
export interface User {
  id: string
  name: string | null
  email: string
  isOnline: boolean
  chatStatus: 'AVAILABLE' | 'BUSY' | 'AWAY'
  lastSeenAt: Date | null
}

export interface Message {
  id: string
  content: string
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
  status: 'SENT' | 'DELIVERED' | 'READ'
  senderId: string
  sender: User
  conversationId: string
  createdAt: Date
  updatedAt: Date
  editedAt: Date | null
}

export interface Conversation {
  id: string
  type: 'DIRECT' | 'GROUP'
  name: string | null
  participants: Array<{
    userId: string
    user: User
  }>
  lastMessage?: Message | null
  lastMessageAt: Date | null
  unreadCount: number
  createdAt: Date
  updatedAt: Date
}

// Chat State
interface ChatState {
  conversations: Conversation[]
  activeConversation: Conversation | null
  messages: Record<string, Message[]> // conversationId -> messages
  onlineUsers: User[]
  typingUsers: Record<string, string[]> // conversationId -> userIds
  isLoading: boolean
  error: string | null
}

// Actions
type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'UPDATE_CONVERSATION'; payload: Conversation }
  | { type: 'SET_ACTIVE_CONVERSATION'; payload: Conversation | null }
  | { type: 'SET_MESSAGES'; payload: { conversationId: string; messages: Message[] } }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: Message }
  | { type: 'SET_ONLINE_USERS'; payload: User[] }
  | { type: 'SET_TYPING'; payload: { conversationId: string; userId: string; isTyping: boolean } }

// Initial state
const initialState: ChatState = {
  conversations: [],
  activeConversation: null,
  messages: {},
  onlineUsers: [],
  typingUsers: {},
  isLoading: false,
  error: null
}

// Reducer
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload }

    case 'ADD_CONVERSATION':
      return {
        ...state,
        conversations: [action.payload, ...state.conversations]
      }

    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.id ? action.payload : conv
        ),
        activeConversation: state.activeConversation?.id === action.payload.id
          ? action.payload
          : state.activeConversation
      }

    case 'SET_ACTIVE_CONVERSATION':
      return { ...state, activeConversation: action.payload }

    case 'SET_MESSAGES':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: action.payload.messages
        }
      }

    case 'ADD_MESSAGE': {
      const { conversationId } = action.payload
      const currentMessages = state.messages[conversationId] || []
      
      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: [...currentMessages, action.payload]
        }
      }
    }

    case 'UPDATE_MESSAGE': {
      const { conversationId } = action.payload
      const currentMessages = state.messages[conversationId] || []
      
      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: currentMessages.map(msg =>
            msg.id === action.payload.id ? action.payload : msg
          )
        }
      }
    }

    case 'SET_ONLINE_USERS':
      return { ...state, onlineUsers: action.payload }

    case 'SET_TYPING': {
      const { conversationId, userId, isTyping } = action.payload
      const currentTyping = state.typingUsers[conversationId] || []
      
      let newTyping: string[]
      if (isTyping) {
        newTyping = currentTyping.includes(userId) ? currentTyping : [...currentTyping, userId]
      } else {
        newTyping = currentTyping.filter(id => id !== userId)
      }
      
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: newTyping
        }
      }
    }

    default:
      return state
  }
}

// Context
interface ChatContextType {
  state: ChatState
  dispatch: React.Dispatch<ChatAction>
  
  // Actions
  loadConversations: () => Promise<void>
  createConversation: (type: 'DIRECT' | 'GROUP', participantId?: string, participantIds?: string[], name?: string) => Promise<Conversation | null>
  setActiveConversation: (conversation: Conversation | null) => void
  loadMessages: (conversationId: string) => Promise<void>
  sendMessage: (conversationId: string, content: string, type?: 'TEXT' | 'IMAGE' | 'FILE') => Promise<void>
  searchUsers: (query: string) => Promise<User[]>
  getOnlineUsers: () => Promise<void>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

// Provider component
interface ChatProviderProps {
  children: ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const { data: session } = useSession()

  // API functions
  const loadConversations = async () => {
    if (!session?.user?.id) return

    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      const response = await fetch('/api/chat/conversations')
      if (!response.ok) {
        throw new Error('Failed to load conversations')
      }

      const data = await response.json()
      dispatch({ type: 'SET_CONVERSATIONS', payload: data.conversations })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const createConversation = async (
    type: 'DIRECT' | 'GROUP',
    participantId?: string,
    participantIds?: string[],
    name?: string
  ): Promise<Conversation | null> => {
    if (!session?.user?.id) return null

    try {
      const payload: any = { type }
      
      if (type === 'DIRECT' && participantId) {
        payload.participantId = participantId
      } else if (type === 'GROUP' && participantIds && name) {
        payload.participantIds = participantIds
        payload.name = name
      }

      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to create conversation')
      }

      const conversation = await response.json()
      dispatch({ type: 'ADD_CONVERSATION', payload: conversation })
      
      return conversation
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
      return null
    }
  }

  const setActiveConversation = (conversation: Conversation | null) => {
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: conversation })
    
    if (conversation) {
      loadMessages(conversation.id)
    }
  }

  const loadMessages = async (conversationId: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`)
      if (!response.ok) {
        throw new Error('Failed to load messages')
      }

      const data = await response.json()
      dispatch({
        type: 'SET_MESSAGES',
        payload: { conversationId, messages: data.messages }
      })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const sendMessage = async (
    conversationId: string,
    content: string,
    type: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT'
  ) => {
    // For now, just add to local state
    // In real implementation, this would also emit to Socket.io
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      type,
      status: 'SENT',
      senderId: session?.user?.id || '',
      sender: {
        id: session?.user?.id || '',
        name: session?.user?.name || null,
        email: session?.user?.email || '',
        isOnline: true,
        chatStatus: 'AVAILABLE',
        lastSeenAt: null
      },
      conversationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      editedAt: null
    }

    dispatch({ type: 'ADD_MESSAGE', payload: tempMessage })
  }

  const searchUsers = async (query: string): Promise<User[]> => {
    if (!session?.user?.id || query.length < 2) return []

    try {
      const response = await fetch(`/api/chat/users/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Failed to search users')
      }

      const data = await response.json()
      return data.users
    } catch (error) {
      console.error('Error searching users:', error)
      return []
    }
  }

  const getOnlineUsers = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/chat/users/online')
      if (!response.ok) {
        throw new Error('Failed to load online users')
      }

      const data = await response.json()
      dispatch({ type: 'SET_ONLINE_USERS', payload: data.users })
    } catch (error) {
      console.error('Error loading online users:', error)
    }
  }

  // Load initial data
  useEffect(() => {
    if (session?.user?.id) {
      loadConversations()
      getOnlineUsers()
    }
  }, [session])

  const contextValue: ChatContextType = {
    state,
    dispatch,
    loadConversations,
    createConversation,
    setActiveConversation,
    loadMessages,
    sendMessage,
    searchUsers,
    getOnlineUsers
  }

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  )
}

// Hook to use chat context
export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

export default ChatProvider