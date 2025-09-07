'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Settings, LogOut } from 'lucide-react'
import Image from 'next/image'
import TaskList from './TaskList'
import PomodoroTimer from './PomodoroTimer'
import AddTaskForm from './AddTaskForm'
import SettingsModal from './SettingsModal'

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

interface PomodoroSession {
  id: string
  type: 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK'
  status: 'RUNNING' | 'COMPLETED' | 'CANCELED'
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentSession, setCurrentSession] = useState<PomodoroSession | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleTaskUpdated = () => {
    fetchTasks()
  }

  const handleSessionChange = (session: PomodoroSession | null) => {
    setCurrentSession(session)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Fast Focus</h1>
              {currentSession && (
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  Session Running
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                {session?.user?.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <div className="text-sm">
                  <p className="text-gray-900 font-medium">{session?.user?.name}</p>
                  <p className="text-gray-500">{session?.user?.email}</p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tasks */}
          <div className="lg:col-span-2 space-y-6">
            <AddTaskForm onTaskCreated={handleTaskUpdated} />
            <TaskList 
              tasks={tasks} 
              onTaskUpdated={handleTaskUpdated}
            />
          </div>

          {/* Right Column - Timer */}
          <div className="lg:col-span-1">
            <PomodoroTimer 
              tasks={tasks}
              onSessionChange={handleSessionChange}
              onTaskUpdated={handleTaskUpdated}
            />
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}