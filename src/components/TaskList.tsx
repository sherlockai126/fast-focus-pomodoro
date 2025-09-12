'use client'

import { Play, CheckCircle, Circle, Hash, AlertCircle } from 'lucide-react'

interface Task {
  id: string
  title: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  tags: string[]
  estimate: number
  status: 'TODO' | 'DONE'
  pomodoroSessions: { id: string }[]
}

interface TaskListProps {
  tasks: Task[]
  onTaskUpdated: () => void
}

export default function TaskList({ tasks, onTaskUpdated }: TaskListProps) {
  const handleToggleStatus = async (taskId: string, currentStatus: 'TODO' | 'DONE') => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: currentStatus === 'TODO' ? 'DONE' : 'TODO' 
        })
      })

      if (response.ok) {
        onTaskUpdated()
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH': return <AlertCircle className="w-3 h-3" />
      case 'MEDIUM': return <Circle className="w-3 h-3" />
      case 'LOW': return <Circle className="w-3 h-3" />
      default: return <Circle className="w-3 h-3" />
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Circle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No tasks yet. Add one above to get started!</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {tasks.map((task) => {
        const tags = Array.isArray(task.tags) ? task.tags : 
          (typeof task.tags === 'string' && task.tags ? JSON.parse(task.tags) : [])
        
        return (
          <div
            key={task.id}
            className={`p-4 hover:bg-gray-50 transition-colors ${
              task.status === 'DONE' ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <button
                  onClick={() => handleToggleStatus(task.id, task.status)}
                  className={`mt-1 ${
                    task.status === 'DONE' 
                      ? 'text-green-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {task.status === 'DONE' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-base ${task.status === 'DONE' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                      >
                        <Hash className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                    
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`}>
                      {getPriorityIcon(task.priority)}
                      <span className="ml-1">{task.priority.toLowerCase()}</span>
                    </span>
                    
                    <span className="text-xs text-gray-500">
                      {task.pomodoroSessions.length}/{task.estimate} 🍅
                    </span>
                  </div>
                </div>
              </div>
              
              {task.status === 'TODO' && (
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                    onClick={() => {
                      // TODO: Start pomodoro for this task
                      console.log('Start pomodoro for task:', task.id)
                    }}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Start
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}