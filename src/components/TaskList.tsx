'use client'

import { useState } from 'react'
import { CheckCircle, Circle, Clock, Flag, Hash, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'

interface Task {
  id: string
  title: string
  notes: string | null
  status: string
  priority: string
  pomodoroEstimate: number
  tags: string
  dueDate: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

interface TaskListProps {
  tasks: Task[]
  onTaskUpdated: () => void
}

export default function TaskList({ tasks, onTaskUpdated }: TaskListProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'TODO' | 'COMPLETED'>('ALL')

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'TODO' ? 'COMPLETED' : 'TODO'
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        onTaskUpdated()
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onTaskUpdated()
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'ALL') return true
    return task.status === filter
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-50'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50'
      case 'LOW': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const parseTags = (tagsString: string): string[] => {
    try {
      return JSON.parse(tagsString)
    } catch {
      return []
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('ALL')}
              className={clsx(
                'px-3 py-1 text-sm rounded-lg transition-colors',
                filter === 'ALL' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setFilter('TODO')}
              className={clsx(
                'px-3 py-1 text-sm rounded-lg transition-colors',
                filter === 'TODO' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              Active ({tasks.filter(t => t.status === 'TODO').length})
            </button>
            <button
              onClick={() => setFilter('COMPLETED')}
              className={clsx(
                'px-3 py-1 text-sm rounded-lg transition-colors',
                filter === 'COMPLETED' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              Done ({tasks.filter(t => t.status === 'COMPLETED').length})
            </button>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="divide-y">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {filter === 'ALL' ? 'No tasks yet. Add one above!' : `No ${filter.toLowerCase()} tasks.`}
          </div>
        ) : (
          filteredTasks.map((task) => {
            const tags = parseTags(task.tags)
            const isExpanded = expandedTask === task.id
            const isCompleted = task.status === 'COMPLETED'

            return (
              <div key={task.id} className={clsx(
                'transition-colors',
                isCompleted ? 'bg-gray-50' : 'hover:bg-gray-50'
              )}>
                {/* Main Task Row */}
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => toggleTaskStatus(task.id, task.status)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={clsx(
                            'text-base font-medium',
                            isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
                          )}>
                            {task.title}
                          </h3>
                          
                          {/* Meta info */}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                            <span className={clsx(
                              'inline-flex items-center px-2 py-0.5 rounded',
                              getPriorityColor(task.priority)
                            )}>
                              <Flag className="w-3 h-3 mr-1" />
                              {task.priority.toLowerCase()}
                            </span>
                            
                            <span className="inline-flex items-center text-gray-600">
                              <Clock className="w-3 h-3 mr-1" />
                              {task.pomodoroEstimate} 🍅
                            </span>

                            {tags.length > 0 && (
                              <div className="inline-flex items-center space-x-1">
                                <Hash className="w-3 h-3 text-gray-400" />
                                {tags.map(tag => (
                                  <span key={tag} className="text-blue-600">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {task.completedAt && (
                              <span className="text-green-600">
                                ✓ {formatDate(task.completedAt)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pl-12">
                    <div className="text-sm text-gray-600 space-y-2">
                      {task.notes && (
                        <div>
                          <span className="font-medium">Notes:</span> {task.notes}
                        </div>
                      )}
                      {task.dueDate && (
                        <div>
                          <span className="font-medium">Due:</span> {formatDate(task.dueDate)}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Created:</span> {formatDate(task.createdAt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}