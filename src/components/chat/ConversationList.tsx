'use client'

import { useChat } from './ChatProvider'
import { User, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function ConversationList() {
  const { state, setActiveConversation } = useChat()

  const formatTime = (date: Date | null) => {
    if (!date) return ''
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  }

  const getConversationName = (conversation: any) => {
    if (conversation.name) return conversation.name
    
    // For direct conversations, show other participant's name
    return conversation.participants
      .filter((p: any) => p.userId !== state.activeConversation?.id)
      .map((p: any) => p.user.name || p.user.email)
      .join(', ')
  }

  const getLastMessagePreview = (message: any) => {
    if (!message) return 'No messages yet'
    
    switch (message.type) {
      case 'IMAGE':
        return '📷 Image'
      case 'FILE':
        return '📁 File'
      case 'SYSTEM':
        return message.content
      default:
        return message.content
    }
  }

  if (state.conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No conversations yet</p>
          <p className="text-xs">Start a new conversation to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {state.conversations.map((conversation) => {
        const isActive = state.activeConversation?.id === conversation.id
        
        return (
          <button
            key={conversation.id}
            onClick={() => setActiveConversation(conversation)}
            className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
              isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
            }`}
          >
            <div className="flex gap-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  {conversation.type === 'GROUP' ? (
                    <Users className="w-6 h-6 text-white" />
                  ) : (
                    <User className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-sm truncate">
                    {getConversationName(conversation)}
                  </h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {conversation.lastMessageAt && (
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessageAt)}
                      </span>
                    )}
                    {conversation.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600 truncate flex-1">
                    {conversation.lastMessage && (
                      <span className={conversation.lastMessage.senderId === 'current-user' ? 'text-gray-800' : ''}>
                        {conversation.lastMessage.senderId === 'current-user' && 'You: '}
                        {getLastMessagePreview(conversation.lastMessage)}
                      </span>
                    )}
                    {!conversation.lastMessage && (
                      <span className="italic">No messages yet</span>
                    )}
                  </p>

                  {/* Online indicators for direct conversations */}
                  {conversation.type === 'DIRECT' && (
                    <div className="flex">
                      {conversation.participants
                        .filter(p => p.userId !== 'current-user') // Replace with actual current user ID
                        .map(participant => (
                          <div
                            key={participant.userId}
                            className={`w-2 h-2 rounded-full ${
                              participant.user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                        ))}
                    </div>
                  )}
                </div>

                {/* Typing indicator */}
                {state.typingUsers[conversation.id]?.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-blue-600">
                      {state.typingUsers[conversation.id].length === 1 ? 'Someone is typing...' : 'People are typing...'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}