'use client'

import { useState } from 'react'
import { useChat } from './ChatProvider'
import ConversationList from './ConversationList'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { User, MessageSquare, Users, Search, Plus, X } from 'lucide-react'

export default function ChatInterface() {
  const { state, setActiveConversation, createConversation, searchUsers } = useChat()
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchUsers(query)
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleCreateConversation = async (user: any) => {
    const conversation = await createConversation('DIRECT', user.id)
    if (conversation) {
      setActiveConversation(conversation)
      setShowNewConversation(false)
      setSearchQuery('')
      setSearchResults([])
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Chat
            </h1>
            <button
              onClick={() => setShowNewConversation(!showNewConversation)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {showNewConversation ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>

          {/* New Conversation Panel */}
          {showNewConversation && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {isSearching && (
                <div className="text-center py-2 text-gray-500 text-sm">
                  Searching...
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleCreateConversation(user)}
                      className="w-full text-left p-2 hover:bg-gray-100 rounded-lg flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {user.name || user.email}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                          {user.isOnline ? 'Online' : 'Offline'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                <div className="text-center py-2 text-gray-500 text-sm">
                  No users found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-hidden">
          <ConversationList />
        </div>

        {/* Online Users Count */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{state.onlineUsers.length} users online</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {state.activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  {state.activeConversation.type === 'GROUP' ? (
                    <Users className="w-5 h-5 text-white" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold">
                    {state.activeConversation.name ||
                      state.activeConversation.participants
                        .filter(p => p.userId !== state.activeConversation?.id)
                        .map(p => p.user.name || p.user.email)
                        .join(', ')
                    }
                  </h2>
                  <div className="text-sm text-gray-500">
                    {state.activeConversation.type === 'DIRECT' ? (
                      state.activeConversation.participants
                        .filter(p => p.userId !== state.activeConversation?.id)
                        .map(p => (
                          <span key={p.userId} className="flex items-center gap-1">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                p.user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                            />
                            {p.user.isOnline ? 'Online' : 'Offline'}
                          </span>
                        ))
                    ) : (
                      `${state.activeConversation.participants.length} members`
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <MessageList />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <MessageInput />
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome to Chat
              </h2>
              <p className="text-gray-600 mb-6">
                Select a conversation or start a new one to begin chatting
              </p>
              <button
                onClick={() => setShowNewConversation(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {state.isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {state.error && (
        <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {state.error}
        </div>
      )}
    </div>
  )
}