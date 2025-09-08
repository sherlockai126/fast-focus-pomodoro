import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create demo user (this would typically be created via OAuth)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@fastfocus.app' },
    update: {},
    create: {
      email: 'demo@fastfocus.app',
      name: 'Demo User',
      timezone: 'UTC',
    },
  })

  console.log('✅ Created demo user:', demoUser.email)

  // Create default settings for demo user
  const settings = await prisma.settings.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      pomodoroLen: 25,
      shortBreak: 5,
      longBreak: 15,
      longEvery: 4,
      soundEnabled: true,
      notificationEnabled: true,
      webhookUrl: 'https://your-n8n-instance.com/webhook/fast-focus',
      webhookSecret: crypto.randomBytes(32).toString('hex'),
    },
  })

  console.log('✅ Created settings for demo user')

  // Create sample tasks
  const sampleTasks = [
    {
      title: 'Write project specification',
      notes: 'Define requirements, scope, and technical approach',
      priority: 'HIGH' as const,
      tags: JSON.stringify(['documentation', 'planning']),
      pomodoroEstimate: 3,
    },
    {
      title: 'Review pull requests',
      notes: 'Check team PRs and provide feedback',
      priority: 'MEDIUM' as const,
      tags: JSON.stringify(['code-review', 'teamwork']),
      pomodoroEstimate: 2,
      status: 'COMPLETED' as const,
      completedAt: new Date(),
    },
    {
      title: 'Update user dashboard',
      notes: 'Add new analytics widgets',
      priority: 'MEDIUM' as const,
      tags: JSON.stringify(['frontend', 'ui']),
      pomodoroEstimate: 4,
    },
    {
      title: 'Deploy to staging',
      notes: 'Deploy latest changes to staging environment',
      priority: 'LOW' as const,
      tags: JSON.stringify(['devops', 'deployment']),
      pomodoroEstimate: 1,
    },
    {
      title: 'Research competitor features',
      notes: 'Analyze competitor offerings for Q2 roadmap',
      priority: 'LOW' as const,
      tags: JSON.stringify(['research', 'strategy']),
      pomodoroEstimate: 2,
    },
  ]

  for (const taskData of sampleTasks) {
    const task = await prisma.task.create({
      data: {
        ...taskData,
        userId: demoUser.id,
      },
    })
    console.log(`✅ Created task: ${task.title}`)
  }

  // Create sample completed pomodoro sessions
  const completedTask = await prisma.task.findFirst({
    where: {
      userId: demoUser.id,
      status: 'COMPLETED',
    },
  })

  if (completedTask) {
    const sessions = [
      {
        startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        completedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000), // 2.5 hours ago
        actualSeconds: 1500, // 25 minutes
      },
      {
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        completedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
        actualSeconds: 1500, // 25 minutes
      },
    ]

    for (const sessionData of sessions) {
      const session = await prisma.pomodoroSession.create({
        data: {
          ...sessionData,
          userId: demoUser.id,
          taskId: completedTask.id,
          status: 'COMPLETED',
          type: 'POMODORO',
        },
      })

      // Create webhook delivery record for each session
      await prisma.webhookDelivery.create({
        data: {
          userId: demoUser.id,
          sessionId: session.id,
          event: 'pomodoro.completed',
          status: 'SUCCESS',
          attempts: 1,
          payload: JSON.stringify({
            event: 'pomodoro.completed',
            user_id: demoUser.id,
            session_id: session.id,
            task: {
              id: completedTask.id,
              title: completedTask.title,
            },
            start_at: session.startedAt.toISOString(),
            end_at: session.completedAt!.toISOString(),
            duration_planned_sec: 1500,
            duration_actual_sec: session.actualSeconds,
            timezone: demoUser.timezone,
            app_version: '1.0.0',
          }),
        },
      })

      console.log(`✅ Created pomodoro session: ${session.id}`)
    }
  }

  console.log('🎉 Seed completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })