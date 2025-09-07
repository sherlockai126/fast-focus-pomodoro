'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Plus, Settings, BarChart3, Clock } from 'lucide-react'
import QuickAddTask from './QuickAddTask'
import TaskList from './TaskList'
import PomodoroTimer from './PomodoroTimer'
import Image from 'next/image'

interface Task {
  id: string
  title: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  tags: string[]
  estimate: number
  status: 'TODO' | 'DONE'
  pomodoroSessions: { id: string }[]
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [currentSession, setCurrentSession] = useState(null)
  const [filter, setFilter] = useState<'today' | 'all' | 'completed'>('today')

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch(`/api/tasks?filter=${filter}`)
      if (response.ok) {
        const data = await response.json()
        if (filter === 'today') {
          setTodayTasks(data.tasks || [])
        } else {
          setTasks(data.tasks || [])
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }, [filter])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault()
        setShowQuickAdd(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const onTaskCreated = () => {
    fetchTasks()
    setShowQuickAdd(false)
  }

  const onTaskUpdated = () => {
    fetchTasks()
  }

  const displayTasks = filter === 'today' ? todayTasks : tasks
  const completedToday = todayTasks.filter(t => t.status === 'DONE').length
  const totalPomodoros = todayTasks.reduce((sum, t) => sum + t.pomodoroSessions.length, 0)
  const plannedPomodoros = todayTasks.filter(t => t.status === 'TODO').reduce((sum, t) => sum + t.estimate, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Clock className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Fast Focus</h1>
              </div>
              
              <nav className="flex space-x-6">
                <button
                  onClick={() => setFilter('today')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    filter === 'today'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Tasks
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    filter === 'completed'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Completed
                </button>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <BarChart3 className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="w-5 h-5" />
              </button>
              <div className="relative">
                <button 
                  onClick={() => signOut()}
                  className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900"
                >
                  {session?.user?.image && (
                    <Image
                      src={session.user.image}
                      alt="User avatar"
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium">{session?.user?.name}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tasks */}
          <div className="lg:col-span-2">
            {/* Stats */}
            {filter === 'today' && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{completedToday}</div>
                  <div className="text-sm text-gray-600">Tasks Done</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-red-600">{totalPomodoros}</div>
                  <div className="text-sm text-gray-600">Pomodoros</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">{plannedPomodoros * 25}m</div>
                  <div className="text-sm text-gray-600">Planned</div>
                </div>
              </div>
            )}

            {/* Quick Add */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              {!showQuickAdd ? (
                <button
                  onClick={() => setShowQuickAdd(true)}
                  className="w-full text-left text-gray-400 hover:text-gray-600 flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add a task and press Enter to plan your day... (Press Q)</span>
                </button>
              ) : (
                <QuickAddTask 
                  onTaskCreated={onTaskCreated}
                  onCancel={() => setShowQuickAdd(false)}
                />
              )}
            </div>

            {/* Task List */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  {filter === 'today' ? "Today's Tasks" : 
                   filter === 'completed' ? 'Completed Tasks' : 'All Tasks'}
                </h2>
              </div>
              <TaskList 
                tasks={displayTasks}
                onTaskUpdated={onTaskUpdated}
              />
            </div>
          </div>

          {/* Right Column - Timer */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <PomodoroTimer 
                tasks={todayTasks.filter(t => t.status === 'TODO')}
                onSessionChange={setCurrentSession}
                onTaskUpdated={onTaskUpdated}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}