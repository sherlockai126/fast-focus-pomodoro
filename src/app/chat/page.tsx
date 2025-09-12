import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ChatProvider from '@/components/chat/ChatProvider'
import ChatInterface from '@/components/chat/ChatInterface'

export default async function ChatPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="h-screen">
      <ChatProvider>
        <ChatInterface />
      </ChatProvider>
    </div>
  )
}

export const metadata = {
  title: 'Chat - Fast Focus Pomodoro',
  description: 'Real-time chat with your team'
}