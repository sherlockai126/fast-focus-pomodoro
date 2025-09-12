'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from './ChatProvider'
import { Send, Paperclip, Smile } from 'lucide-react'

export default function MessageInput() {
  const { state, sendMessage } = useChat()
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const activeConversation = state.activeConversation

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  // Handle typing indicators
  const handleTypingStart = () => {
    if (!isTyping && activeConversation) {
      setIsTyping(true)
      // In real implementation, emit typing_start to socket
      console.log('User started typing in conversation:', activeConversation.id)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && activeConversation) {
        setIsTyping(false)
        // In real implementation, emit typing_stop to socket
        console.log('User stopped typing in conversation:', activeConversation.id)
      }
    }, 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || !activeConversation) return

    const messageText = message.trim()
    setMessage('')
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }

    // Send message
    try {
      await sendMessage(activeConversation.id, messageText, 'TEXT')
    } catch (error) {
      console.error('Failed to send message:', error)
      // In production, show error toast
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileUpload = () => {
    // TODO: Implement file upload
    console.log('File upload clicked')
  }

  const handleEmojiPicker = () => {
    // TODO: Implement emoji picker
    console.log('Emoji picker clicked')
  }

  if (!activeConversation) {
    return null
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      {/* File Upload Button */}
      <button
        type="button"
        onClick={handleFileUpload}
        className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Attach file"
      >
        <Paperclip className="w-5 h-5" />
      </button>

      {/* Message Input Container */}
      <div className="flex-1 relative">
        <div className="flex items-end bg-gray-100 rounded-lg border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              handleTypingStart()
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${
              activeConversation.type === 'GROUP' 
                ? activeConversation.name || 'group'
                : activeConversation.participants
                    .filter(p => p.userId !== activeConversation.id)
                    .map(p => p.user.name || p.user.email)
                    .join(', ')
            }...`}
            className="flex-1 bg-transparent border-none outline-none resize-none py-3 px-4 text-sm placeholder-gray-500 max-h-32"
            rows={1}
            style={{ minHeight: '44px' }}
            disabled={state.isLoading}
          />

          {/* Emoji Button */}
          <button
            type="button"
            onClick={handleEmojiPicker}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {/* Character count for long messages */}
        {message.length > 800 && (
          <div className="absolute -top-6 right-0 text-xs text-gray-500">
            {message.length}/2000
          </div>
        )}
      </div>

      {/* Send Button */}
      <button
        type="submit"
        disabled={!message.trim() || state.isLoading}
        className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
          message.trim() && !state.isLoading
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        title="Send message"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  )
}

// Character limit warning component
function CharacterLimit({ current, max }: { current: number; max: number }) {
  if (current < max * 0.8) return null

  const isNearLimit = current > max * 0.9
  const isOverLimit = current > max

  return (
    <div className={`text-xs ${
      isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-600' : 'text-gray-500'
    }`}>
      {current}/{max}
    </div>
  )
}