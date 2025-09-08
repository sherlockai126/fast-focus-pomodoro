'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Square, LogIn, Clock, TrendingUp } from 'lucide-react'
import { signIn } from 'next-auth/react'

interface LocalSession {
  id: string
  type: 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK'
  startedAt: string
  completedAt?: string
  duration: number
  taskTitle?: string
}

export default function AnonymousPomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionType, setSessionType] = useState<'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK'>('POMODORO')
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [currentTaskTitle, setCurrentTaskTitle] = useState('')
  const [todaysSessions, setTodaysSessions] = useState<LocalSession[]>([])
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const currentSessionRef = useRef<LocalSession | null>(null)

  // Load sessions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('anonymousSessions')
    if (stored) {
      const sessions: LocalSession[] = JSON.parse(stored)
      const today = new Date().toDateString()
      const todaysData = sessions.filter(s => 
        new Date(s.startedAt).toDateString() === today
      )
      setTodaysSessions(todaysData)
      setCompletedPomodoros(todaysData.filter(s => s.type === 'POMODORO' && s.completedAt).length)
    }

    // Check if should show sign-in prompt
    const promptDismissed = localStorage.getItem('signInPromptDismissed')
    const lastPrompt = localStorage.getItem('lastSignInPrompt')
    const now = Date.now()
    
    if (!promptDismissed && (!lastPrompt || now - parseInt(lastPrompt) > 3600000)) {
      setTimeout(() => setShowSignInPrompt(true), 5000)
    }
  }, [])

  const getDurationForType = (type: 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK') => {
    switch (type) {
      case 'POMODORO': return 25 * 60
      case 'SHORT_BREAK': return 5 * 60
      case 'LONG_BREAK': return 15 * 60
      default: return 25 * 60
    }
  }

  const saveSession = (session: LocalSession) => {
    const stored = localStorage.getItem('anonymousSessions')
    const sessions: LocalSession[] = stored ? JSON.parse(stored) : []
    
    const existingIndex = sessions.findIndex(s => s.id === session.id)
    if (existingIndex >= 0) {
      sessions[existingIndex] = session
    } else {
      sessions.push(session)
    }
    
    localStorage.setItem('anonymousSessions', JSON.stringify(sessions))
    
    const today = new Date().toDateString()
    const todaysData = sessions.filter(s => 
      new Date(s.startedAt).toDateString() === today
    )
    setTodaysSessions(todaysData)
  }

  const handleTimerComplete = useCallback(() => {
    if (!currentSessionRef.current) return

    const completedSession = {
      ...currentSessionRef.current,
      completedAt: new Date().toISOString()
    }
    saveSession(completedSession)

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Complete!', {
        body: sessionType === 'POMODORO' 
          ? `Completed ${currentTaskTitle || 'pomodoro session'}`
          : 'Break time finished',
        icon: '/favicon.ico'
      })
    }

    if (sessionType === 'POMODORO') {
      setCompletedPomodoros(prev => prev + 1)
      const shouldTakeLongBreak = (completedPomodoros + 1) % 4 === 0
      setSessionType(shouldTakeLongBreak ? 'LONG_BREAK' : 'SHORT_BREAK')
      setTimeLeft(getDurationForType(shouldTakeLongBreak ? 'LONG_BREAK' : 'SHORT_BREAK'))
      
      // Show sign-in prompt after completing pomodoros
      if ((completedPomodoros + 1) % 2 === 0 && !localStorage.getItem('signInPromptDismissed')) {
        setShowSignInPrompt(true)
        localStorage.setItem('lastSignInPrompt', Date.now().toString())
      }
    } else {
      setSessionType('POMODORO')
      setTimeLeft(getDurationForType('POMODORO'))
    }

    setIsRunning(false)
    currentSessionRef.current = null
  }, [sessionType, currentTaskTitle, completedPomodoros])

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

  const startTimer = () => {
    const session: LocalSession = {
      id: `session_${Date.now()}`,
      type: sessionType,
      startedAt: new Date().toISOString(),
      duration: getDurationForType(sessionType),
      taskTitle: sessionType === 'POMODORO' ? currentTaskTitle : undefined
    }
    
    currentSessionRef.current = session
    saveSession(session)
    setIsRunning(true)
    startTimeRef.current = Date.now()
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const cancelTimer = () => {
    if (currentSessionRef.current) {
      // Save partial session
      const canceledSession = {
        ...currentSessionRef.current,
        completedAt: new Date().toISOString(),
        duration: Math.floor((Date.now() - startTimeRef.current) / 1000)
      }
      saveSession(canceledSession)
    }
    
    setIsRunning(false)
    setTimeLeft(getDurationForType(sessionType))
    currentSessionRef.current = null
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
    }
  }

  const getSessionLabel = () => {
    switch (sessionType) {
      case 'POMODORO': return 'Focus Time'
      case 'SHORT_BREAK': return 'Short Break'
      case 'LONG_BREAK': return 'Long Break'
    }
  }

  const getTotalFocusTime = () => {
    const pomodoroSessions = todaysSessions.filter(s => 
      s.type === 'POMODORO' && s.completedAt
    )
    const totalSeconds = pomodoroSessions.reduce((acc, s) => acc + s.duration, 0)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Sign In CTA */}
        <div className="flex justify-between items-center mb-8 pt-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Fast Focus</h1>
          </div>
          
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard?sync=true' })}
            className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg shadow hover:shadow-md transition-all border border-blue-200"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Sign in with Google
          </button>
        </div>

        {/* Main Timer Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center mb-6">
            <h2 className={`text-2xl font-bold mb-2 ${getSessionColor()}`}>
              {getSessionLabel()}
            </h2>
            <div className={`text-7xl font-mono font-bold mb-4 ${getSessionColor()}`}>
              {formatTime(timeLeft)}
            </div>
            
            {/* Quick Task Input */}
            {sessionType === 'POMODORO' && !isRunning && (
              <div className="mb-4 max-w-md mx-auto">
                <input
                  type="text"
                  value={currentTaskTitle}
                  onChange={(e) => setCurrentTaskTitle(e.target.value)}
                  placeholder="What are you working on? (optional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Current Task Display */}
            {isRunning && currentTaskTitle && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg max-w-md mx-auto">
                <div className="text-sm text-blue-600 font-medium">Working on:</div>
                <div className="text-blue-900">{currentTaskTitle}</div>
              </div>
            )}

            {/* Controls */}
            <div className="flex justify-center space-x-3">
              {!isRunning ? (
                <button
                  onClick={startTimer}
                  className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
                >
                  <Play className="w-6 h-6 mr-2" />
                  Start {getSessionLabel()}
                </button>
              ) : (
                <>
                  <button
                    onClick={pauseTimer}
                    className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </button>
                  <button
                    onClick={cancelTimer}
                    className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Session Type Switcher */}
          {!isRunning && (
            <div className="border-t pt-4">
              <div className="flex justify-center space-x-2">
                {(['POMODORO', 'SHORT_BREAK', 'LONG_BREAK'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSessionType(type)
                      setTimeLeft(getDurationForType(type))
                    }}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      sessionType === type 
                        ? type === 'POMODORO' ? 'bg-red-100 text-red-800'
                          : type === 'SHORT_BREAK' ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {type === 'POMODORO' ? 'Pomodoro' 
                      : type === 'SHORT_BREAK' ? 'Short Break' 
                      : 'Long Break'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Today&apos;s Progress</h3>
              <p className="text-gray-600">Keep up the great work!</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{completedPomodoros}</div>
              <div className="text-sm text-gray-600">Pomodoros</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{getTotalFocusTime()}</div>
              <div className="text-sm text-gray-600">Focus Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{todaysSessions.length}</div>
              <div className="text-sm text-gray-600">Sessions</div>
            </div>
          </div>
        </div>

        {/* Sign In Prompt */}
        {showSignInPrompt && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">
                  🎉 Great progress! Save your sessions
                </h3>
                <p className="mb-4 opacity-90">
                  Sign in with Google to save your focus sessions, view detailed statistics, 
                  and sync with Google Calendar.
                </p>
                <button
                  onClick={() => signIn('google', { callbackUrl: '/dashboard?sync=true' })}
                  className="px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Sign in &amp; Save Progress
                </button>
              </div>
              <button
                onClick={() => {
                  setShowSignInPrompt(false)
                  localStorage.setItem('signInPromptDismissed', 'true')
                }}
                className="text-white/70 hover:text-white ml-4"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}