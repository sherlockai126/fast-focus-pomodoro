import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AnonymousPomodoroTimer from '@/components/AnonymousPomodoroTimer'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  
  // If user is already signed in, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }

  // Show anonymous Pomodoro timer for non-authenticated users
  return <AnonymousPomodoroTimer />
}