'use client'

import { useChat } from './ChatProvider'
import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns'
import { Check, CheckCheck, Clock, User } from 'lucide-react'

export default function MessageList() {
  const { state } = useChat()
  const { data: session } = useSession()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const messages = state.activeConversation 
    ? state.messages[state.activeConversation.id] || []
    : []

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const formatMessageTime = (date: Date) => {
    const messageDate = new Date(date)
    
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm')
    } else if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, 'HH:mm')}`
    } else {
      return format(messageDate, 'MMM d, HH:mm')
    }
  }

  const formatDateDivider = (date: Date) => {
    const messageDate = new Date(date)
    
    if (isToday(messageDate)) {
      return 'Today'
    } else if (isYesterday(messageDate)) {
      return 'Yesterday'
    } else {
      return format(messageDate, 'EEEE, MMMM d')
    }
  }

  const shouldShowDateDivider = (currentMessage: any, previousMessage: any) => {
    if (!previousMessage) return true
    
    const currentDate = new Date(currentMessage.createdAt)
    const previousDate = new Date(previousMessage.createdAt)
    
    return currentDate.toDateString() !== previousDate.toDateString()
  }

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <Check className="w-3 h-3" />
      case 'DELIVERED':
        return <CheckCheck className="w-3 h-3" />
      case 'READ':
        return <CheckCheck className="w-3 h-3 text-blue-500" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  const isOwnMessage = (message: any) => {
    return message.senderId === session?.user?.id
  }

  const shouldGroupMessages = (currentMessage: any, previousMessage: any) => {
    if (!previousMessage) return false
    
    const timeDiff = new Date(currentMessage.createdAt).getTime() - new Date(previousMessage.createdAt).getTime()
    const fiveMinutes = 5 * 60 * 1000
    
    return (
      currentMessage.senderId === previousMessage.senderId &&
      timeDiff < fiveMinutes
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm mb-2">No messages yet</p>
          <p className="text-xs">Start the conversation by sending a message</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {messages.map((message, index) => {
        const previousMessage = index > 0 ? messages[index - 1] : null
        const isOwn = isOwnMessage(message)
        const showDateDivider = shouldShowDateDivider(message, previousMessage)
        const isGrouped = shouldGroupMessages(message, previousMessage)

        return (
          <div key={message.id}>
            {/* Date Divider */}
            {showDateDivider && (
              <div className="flex items-center justify-center my-6">
                <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                  {formatDateDivider(message.createdAt)}
                </div>
              </div>
            )}

            {/* Message */}
            <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar - only show if not grouped and not own message */}
                {!isGrouped && !isOwn && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {message.sender.name?.charAt(0)?.toUpperCase() || 
                         message.sender.email?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Message Content */}
                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name - only for group chats and if not own message and not grouped */}
                  {!isOwn && !isGrouped && state.activeConversation?.type === 'GROUP' && (
                    <span className="text-xs text-gray-600 mb-1 px-2">
                      {message.sender.name || message.sender.email}
                    </span>
                  )}

                  {/* Message Bubble */}
                  <div className={`relative px-4 py-2 rounded-2xl max-w-full break-words ${
                    isOwn 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  } ${
                    isGrouped 
                      ? (isOwn ? 'rounded-tr-md' : 'rounded-tl-md')
                      : ''
                  }`}>
                    {/* Message Content */}
                    {message.type === 'TEXT' ? (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    ) : message.type === 'IMAGE' ? (
                      <div className="space-y-2">
                        <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center">
                          <span className="text-gray-500">📷 Image</span>
                        </div>
                        {message.content && (
                          <p className="text-sm">{message.content}</p>
                        )}
                      </div>
                    ) : message.type === 'FILE' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
                          📁
                        </div>
                        <span className="text-sm">{message.content}</span>
                      </div>
                    ) : (
                      <p className="text-sm italic opacity-75">{message.content}</p>
                    )}

                    {/* Message Meta */}
                    <div className={`flex items-center gap-1 mt-1 text-xs ${
                      isOwn ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <span>{formatMessageTime(message.createdAt)}</span>
                      {isOwn && (
                        <div className="flex items-center">
                          {getMessageStatusIcon(message.status)}
                        </div>
                      )}
                      {message.editedAt && (
                        <span className="italic">edited</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Spacer for grouped messages */}
                {isGrouped && !isOwn && (
                  <div className="w-8 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        )
      })}
      
      {/* Typing Indicators */}
      {state.activeConversation && state.typingUsers[state.activeConversation.id]?.length > 0 && (
        <div className="flex justify-start">
          <div className="flex gap-2 max-w-xs">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-xs">...</span>
            </div>
            <div className="bg-gray-100 px-4 py-2 rounded-2xl">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  )
}