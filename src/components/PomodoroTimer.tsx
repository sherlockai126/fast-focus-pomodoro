'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Square } from 'lucide-react'

interface Task {
  id: string
  title: string
  status: string
}

interface PomodoroSession {
  id: string
  type: 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK'
  status: 'RUNNING' | 'COMPLETED' | 'CANCELED'
}

interface PomodoroTimerProps {
  tasks: Task[]
  onSessionChange: (session: PomodoroSession | null) => void
  onTaskUpdated: () => void
}

export default function PomodoroTimer({ tasks, onSessionChange, onTaskUpdated }: PomodoroTimerProps) {
  const [currentSession, setCurrentSession] = useState<PomodoroSession | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false)
  const [sessionType, setSessionType] = useState<'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK'>('POMODORO')
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  const getDurationForType = (type: 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK') => {
    switch (type) {
      case 'POMODORO': return 25 * 60
      case 'SHORT_BREAK': return 5 * 60
      case 'LONG_BREAK': return 15 * 60
      default: return 25 * 60
    }
  }

  const resetTimer = useCallback(() => {
    setCurrentSession(null)
    setIsRunning(false)
    startTimeRef.current = 0
    onSessionChange(null)
  }, [onSessionChange])

  const handleTimerComplete = useCallback(async () => {
    if (!currentSession) return

    try {
      const actualSeconds = getDurationForType(sessionType)
      
      await fetch('/api/pomodoro/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.id,
          actualSeconds
        })
      })

      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const taskTitle = selectedTaskId 
          ? tasks.find(t => t.id === selectedTaskId)?.title 
          : 'Focus session'
        
        new Notification('Timer Complete!', {
          body: sessionType === 'POMODORO' 
            ? `Completed ${taskTitle || 'pomodoro session'}`
            : 'Break time finished',
          icon: '/favicon.ico'
        })
      }

      if (sessionType === 'POMODORO') {
        setCompletedPomodoros(prev => prev + 1)
        // Show break options
        const shouldTakeLongBreak = (completedPomodoros + 1) % 4 === 0
        setSessionType(shouldTakeLongBreak ? 'LONG_BREAK' : 'SHORT_BREAK')
        setTimeLeft(getDurationForType(shouldTakeLongBreak ? 'LONG_BREAK' : 'SHORT_BREAK'))
      } else {
        // Break finished, back to pomodoro
        setSessionType('POMODORO')
        setTimeLeft(getDurationForType('POMODORO'))
      }

      resetTimer()
      onTaskUpdated()
    } catch (error) {
      console.error('Error completing timer:', error)
    }
  }, [currentSession, sessionType, selectedTaskId, tasks, completedPomodoros, onTaskUpdated, resetTimer])

  // Timer effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft, handleTimerComplete])

  const startTimer = async () => {
    try {
      const response = await fetch('/api/pomodoro/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: selectedTaskId || null,
          type: sessionType
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentSession(data.session)
        setIsRunning(true)
        startTimeRef.current = Date.now()
        onSessionChange(data.session)
        
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission()
        }
      } else if (response.status === 409) {
        // Session already running
        alert('A session is already running. Complete or cancel it first.')
      }
    } catch (error) {
      console.error('Error starting timer:', error)
    }
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const cancelTimer = async () => {
    if (!currentSession) return

    try {
      const actualSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000)
      
      await fetch('/api/pomodoro/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.id,
          actualSeconds
        })
      })

      resetTimer()
    } catch (error) {
      console.error('Error canceling timer:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getSessionColor = () => {
    switch (sessionType) {
      case 'POMODORO': return 'text-red-600'
      case 'SHORT_BREAK': return 'text-green-600'
      case 'LONG_BREAK': return 'text-blue-600'
      default: return 'text-red-600'
    }
  }

  const getSessionLabel = () => {
    switch (sessionType) {
      case 'POMODORO': return 'Focus Time'
      case 'SHORT_BREAK': return 'Short Break'
      case 'LONG_BREAK': return 'Long Break'
      default: return 'Focus Time'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${getSessionColor()}`}>
          {getSessionLabel()}
        </h2>
        <div className={`text-6xl font-mono font-bold mb-4 ${getSessionColor()}`}>
          {formatTime(timeLeft)}
        </div>
        <div className="text-sm text-gray-500 mb-4">
          Session {completedPomodoros + 1} • {completedPomodoros} completed today
        </div>
      </div>

      {/* Task Selection */}
      {sessionType === 'POMODORO' && !currentSession && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Task (Optional)
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No specific task</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Current Task */}
      {currentSession && selectedTaskId && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-600 font-medium">
            Working on:
          </div>
          <div className="text-blue-900">
            {tasks.find(t => t.id === selectedTaskId)?.title || 'Unknown task'}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center space-x-3">
        {!currentSession ? (
          <button
            onClick={startTimer}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Play className="w-5 h-5 mr-2" />
            Start {getSessionLabel()}
          </button>
        ) : (
          <>
            <button
              onClick={isRunning ? pauseTimer : () => setIsRunning(true)}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {isRunning ? (
                <><Pause className="w-4 h-4 mr-2" />Pause</>
              ) : (
                <><Play className="w-4 h-4 mr-2" />Resume</>
              )}
            </button>
            <button
              onClick={cancelTimer}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Square className="w-4 h-4 mr-2" />
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Session Type Switcher (when not running) */}
      {!currentSession && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => {
                setSessionType('POMODORO')
                setTimeLeft(getDurationForType('POMODORO'))
              }}
              className={`px-3 py-1 text-sm rounded ${
                sessionType === 'POMODORO' 
                  ? 'bg-red-100 text-red-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Pomodoro
            </button>
            <button
              onClick={() => {
                setSessionType('SHORT_BREAK')
                setTimeLeft(getDurationForType('SHORT_BREAK'))
              }}
              className={`px-3 py-1 text-sm rounded ${
                sessionType === 'SHORT_BREAK' 
                  ? 'bg-green-100 text-green-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Short Break
            </button>
            <button
              onClick={() => {
                setSessionType('LONG_BREAK')
                setTimeLeft(getDurationForType('LONG_BREAK'))
              }}
              className={`px-3 py-1 text-sm rounded ${
                sessionType === 'LONG_BREAK' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Long Break
            </button>
          </div>
        </div>
      )}
    </div>
  )
}