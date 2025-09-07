'use client'

import { signIn } from 'next-auth/react'
import { Clock, Target, Calendar, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center space-x-2 mb-4">
              <Clock className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
                Fast Focus
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-gray-600 font-light">
              Plan fast. Focus deep.
            </p>
          </div>

          <div className="mb-12">
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              A lightning-fast personal task manager with Pomodoro technique. 
              Add tasks in seconds, run focused sessions, and automatically sync with your calendar through webhooks.
            </p>
            
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard?first=true' })}
              className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Start Free with Google
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Target className="w-12 h-12 text-blue-600 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-3">Quick Add</h3>
              <p className="text-gray-600">
                Add tasks with smart syntax. #tags, !priority, ~estimates in one line.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Clock className="w-12 h-12 text-green-600 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-3">Pomodoro</h3>
              <p className="text-gray-600">
                Distraction-free focus mode with accurate timers that work in background.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Calendar className="w-12 h-12 text-purple-600 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-3">Calendar via n8n</h3>
              <p className="text-gray-600">
                Auto-sync completed sessions to your calendar through webhook integration.
              </p>
            </div>
          </div>

          {/* Demo Preview */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="flex-1 text-left">
                  <div className="bg-gray-100 rounded px-3 py-1 text-sm text-gray-600">
                    localhost:3000/dashboard
                  </div>
                </div>
              </div>
              
              {/* Mock Dashboard Preview */}
              <div className="text-left">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <input
                    type="text"
                    placeholder="Write spec #deepwork !high ~2"
                    className="w-full border-0 bg-transparent text-lg focus:outline-none"
                    disabled
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 border-2 border-blue-600 rounded"></div>
                      <span className="font-medium">Write project specification</span>
                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">deepwork</span>
                      <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">high</span>
                    </div>
                    <div className="text-sm text-gray-500">2 🍅</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-60">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-600 rounded flex items-center justify-center">
                        <div className="w-2 h-1 bg-white rounded"></div>
                      </div>
                      <span className="line-through">Review pull requests</span>
                    </div>
                    <div className="text-sm text-gray-500">✅ 3 🍅</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 text-center text-gray-500">
            <p>Built with Next.js, TypeScript, and Tailwind CSS</p>
          </div>
        </div>
      </div>
    </div>
  )
}