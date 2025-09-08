'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Upload, Loader } from 'lucide-react'

interface LocalSession {
  id: string
  type: 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK'
  startedAt: string
  completedAt?: string
  duration: number
  taskTitle?: string
}

export default function SessionMigration() {
  const searchParams = useSearchParams()
  const shouldSync = searchParams.get('sync') === 'true'
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'completed' | 'error'>('idle')
  const [migratedCount, setMigratedCount] = useState(0)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (shouldSync) {
      migrateAnonymousSessions()
    } else {
      // Check if there are anonymous sessions to migrate
      const stored = localStorage.getItem('anonymousSessions')
      if (stored) {
        const sessions: LocalSession[] = JSON.parse(stored)
        if (sessions.length > 0) {
          setShowBanner(true)
        }
      }
    }
  }, [shouldSync])

  const migrateAnonymousSessions = async () => {
    setMigrationStatus('migrating')
    
    try {
      const stored = localStorage.getItem('anonymousSessions')
      if (!stored) {
        setMigrationStatus('completed')
        return
      }

      const sessions: LocalSession[] = JSON.parse(stored)
      if (sessions.length === 0) {
        setMigrationStatus('completed')
        return
      }

      // Send sessions to backend for migration
      const response = await fetch('/api/sessions/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions })
      })

      if (response.ok) {
        const result = await response.json()
        setMigratedCount(result.migrated)
        
        // Clear local storage after successful migration
        localStorage.removeItem('anonymousSessions')
        localStorage.setItem('sessionsMigrated', 'true')
        
        setMigrationStatus('completed')
        
        // Hide banner after 5 seconds
        setTimeout(() => {
          setShowBanner(false)
        }, 5000)
      } else {
        setMigrationStatus('error')
      }
    } catch (error) {
      console.error('Error migrating sessions:', error)
      setMigrationStatus('error')
    }
  }

  if (!showBanner && migrationStatus === 'idle') {
    return null
  }

  return (
    <div className="mb-6">
      {migrationStatus === 'migrating' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
          <Loader className="w-5 h-5 text-blue-600 animate-spin mr-3" />
          <div>
            <h3 className="font-semibold text-blue-900">Syncing your anonymous sessions...</h3>
            <p className="text-sm text-blue-700">Please wait while we save your previous focus sessions.</p>
          </div>
        </div>
      )}

      {migrationStatus === 'completed' && migratedCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
          <div>
            <h3 className="font-semibold text-green-900">Successfully synced!</h3>
            <p className="text-sm text-green-700">
              {migratedCount} session{migratedCount > 1 ? 's' : ''} have been saved to your account.
            </p>
          </div>
        </div>
      )}

      {migrationStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-900">Sync failed</h3>
          <p className="text-sm text-red-700">
            We couldn't sync your sessions. They're still saved locally and we'll try again later.
          </p>
        </div>
      )}

      {showBanner && migrationStatus === 'idle' && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Upload className="w-5 h-5 mr-3" />
            <div>
              <h3 className="font-semibold">Welcome back!</h3>
              <p className="text-sm opacity-90">You have anonymous sessions that can be synced to your account.</p>
            </div>
          </div>
          <button
            onClick={migrateAnonymousSessions}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Sync Now
          </button>
        </div>
      )}
    </div>
  )
}