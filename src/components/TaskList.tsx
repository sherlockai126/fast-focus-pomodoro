'use client'

import { useState } from 'react'
import { Check, Clock, AlertTriangle, MoreVertical, Trash2, Edit3 } from 'lucide-react'

interface Task {
  id: string
  title: string
  notes: string | null
  status: string
  priority: string
  pomodoroEstimate: number
  tags: string[]
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
  const [filter, setFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'ALL' || task.status === filter
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.notes && task.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          completedAt: status === 'DONE' ? new Date().toISOString() : null
        })
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-50'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50'
      case 'LOW': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string, taskId: string) => {
    switch (status) {
      case 'TODO':
        return (
          <button
            onClick={() => updateTaskStatus(taskId, 'IN_PROGRESS')}
            className="w-5 h-5 border-2 border-gray-400 rounded hover:border-blue-500 transition-colors"
          />
        )
      case 'IN_PROGRESS':
        return (
          <button
            onClick={() => updateTaskStatus(taskId, 'DONE')}
            className="w-5 h-5 border-2 border-blue-500 rounded bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center"
          >
            <Clock className="w-3 h-3 text-blue-500" />
          </button>
        )
      case 'DONE':
        return (
          <button
            onClick={() => updateTaskStatus(taskId, 'TODO')}
            className="w-5 h-5 border-2 border-green-500 rounded bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center"
          >
            <Check className="w-3 h-3 text-white" />
          </button>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Filter */}
          <div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Tasks</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="divide-y divide-gray-200">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'No tasks match your search.' : 'No tasks yet. Add one above!'}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-3">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(task.status, task.id)}
                </div>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`text-sm font-medium ${
                        task.status === 'DONE' ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}>
                        {task.title}
                      </h3>
                      
                      {task.notes && (
                        <p className="mt-1 text-sm text-gray-600">{task.notes}</p>
                      )}
                      
                      <div className="mt-2 flex items-center space-x-2">
                        {/* Priority */}
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                          {task.priority.toLowerCase()}
                        </span>
                        
                        {/* Pomodoro Estimate */}
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                          {task.pomodoroEstimate} 🍅
                        </span>
                        
                        {/* Tags */}
                        {task.tags.map((tag) => (
                          <span key={tag} className="inline-flex px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded">
                            #{tag}
                          </span>
                        ))}
                        
                        {/* Due Date */}
                        {task.dueDate && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-600 bg-orange-100 rounded">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 ml-4">
                      <div className="relative">
                        <button
                          onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {expandedTask === task.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit Task
                              </button>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Task
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}