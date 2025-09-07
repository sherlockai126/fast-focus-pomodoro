'use client'

import { useState } from 'react'

interface QuickAddTaskProps {
  onTaskCreated: () => void
  onCancel: () => void
}

export default function QuickAddTask({ onTaskCreated, onCancel }: QuickAddTaskProps) {
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() })
      })

      if (response.ok) {
        setTitle('')
        onTaskCreated()
      }
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      // Cmd/Ctrl+Enter to create and start
      handleSubmit(e)
      // TODO: Start pomodoro immediately
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write spec #deepwork !high ~2"
        className="flex-1 border-0 bg-transparent text-lg placeholder-gray-400 focus:outline-none focus:ring-0"
        autoFocus
        disabled={isSubmitting}
      />
      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}