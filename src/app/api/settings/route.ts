import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.settings.findUnique({
      where: { userId: session.user.id }
    })

    if (!settings) {
      // Create default settings if none exist
      const newSettings = await prisma.settings.create({
        data: {
          userId: session.user.id,
          pomodoroLen: 25,
          shortBreak: 5,
          longBreak: 15,
          longEvery: 4,
          soundEnabled: true,
          notificationEnabled: true,
        }
      })
      return NextResponse.json({ settings: newSettings })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      pomodoroLen,
      shortBreak,
      longBreak,
      longEvery,
      webhookUrl,
      webhookSecret,
      soundEnabled,
      notificationEnabled
    } = body

    const updateData: Record<string, unknown> = {}
    if (pomodoroLen !== undefined) updateData.pomodoroLen = pomodoroLen
    if (shortBreak !== undefined) updateData.shortBreak = shortBreak
    if (longBreak !== undefined) updateData.longBreak = longBreak
    if (longEvery !== undefined) updateData.longEvery = longEvery
    if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl
    if (webhookSecret !== undefined) updateData.webhookSecret = webhookSecret
    if (soundEnabled !== undefined) updateData.soundEnabled = soundEnabled
    if (notificationEnabled !== undefined) updateData.notificationEnabled = notificationEnabled

    const settings = await prisma.settings.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        ...updateData,
        pomodoroLen: pomodoroLen || 25,
        shortBreak: shortBreak || 5,
        longBreak: longBreak || 15,
        longEvery: longEvery || 4,
        soundEnabled: soundEnabled ?? true,
        notificationEnabled: notificationEnabled ?? true,
      }
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}