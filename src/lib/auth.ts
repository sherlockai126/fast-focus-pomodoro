import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id
      }
      return session
    },
    signIn: async ({ user, account, profile }) => {
      // Auto-create user settings and detect timezone
      if (user.id && account?.provider === 'google') {
        const existingSettings = await prisma.settings.findUnique({
          where: { userId: user.id }
        })
        
        if (!existingSettings) {
          // Create default settings for new user
          await prisma.settings.create({
            data: {
              userId: user.id,
              pomodoroLen: 25,
              shortBreak: 5,
              longBreak: 15,
              longEvery: 4,
              soundEnabled: true,
              notificationEnabled: true,
            }
          })
        }
        
        // Update user timezone 
        if (user.id) {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
          await prisma.user.update({
            where: { id: user.id },
            data: { timezone }
          })
        }
      }
      
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: "database",
  },
}