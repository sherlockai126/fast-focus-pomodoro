'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

interface AddTaskFormProps {
  onTaskCreated: () => void
}

export default function AddTaskForm({ onTaskCreated }: AddTaskFormProps) {
  const [taskText, setTaskText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskText.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskText: taskText.trim() }),
      })

      if (response.ok) {
        setTaskText('')
        onTaskCreated()
      } else {
        console.error('Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Task</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder="Enter task title... (use #tags, !priority, ~estimate)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            disabled={isSubmitting}
          />
          <p className="mt-2 text-sm text-gray-500">
            Use <span className="font-mono bg-gray-100 px-1 rounded">#tag</span> for tags, 
            <span className="font-mono bg-gray-100 px-1 rounded mx-1">!high</span> for priority, 
            <span className="font-mono bg-gray-100 px-1 rounded">~3</span> for pomodoro estimate
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!taskText.trim() || isSubmitting}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Adding...' : 'Add Task'}
          </button>
        </div>
      </form>
    </div>
  )
}