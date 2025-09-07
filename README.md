# Fast Focus Pomodoro

A lightning-fast personal task manager with Pomodoro technique integration.

## Features

- **Quick Task Entry**: Add tasks with smart syntax including tags (#), priorities (!), and time estimates (~)
- **Pomodoro Timer**: Distraction-free focus sessions with automatic break scheduling
- **Calendar Integration**: Sync completed sessions via webhooks (n8n/Zapier compatible)
- **Google Authentication**: Secure login with Google OAuth
- **Real-time Notifications**: Desktop notifications for session completions

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL via Supabase
- **Authentication**: NextAuth.js with Google provider
- **Styling**: Tailwind CSS
- **ORM**: Prisma
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18 or later
- A Supabase account and project
- Google OAuth credentials
- Vercel account for deployment

### Environment Variables

Create a `.env.local` file with:

```env
# Database
DATABASE_URL="your-supabase-connection-string"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Installation

```bash
npm install
npx prisma migrate deploy
npm run dev
```

## Deployment

This project is optimized for deployment on Vercel with automatic TypeScript and ESLint validation.

## API Reference

### Tasks API
- `GET /api/tasks` - List user tasks with optional filtering
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/[id]` - Update existing task
- `DELETE /api/tasks/[id]` - Delete task

### Pomodoro API
- `POST /api/pomodoro/start` - Start new session
- `POST /api/pomodoro/complete` - Complete current session
- `POST /api/pomodoro/cancel` - Cancel current session

### Settings API
- `GET /api/settings` - Get user preferences
- `PUT /api/settings` - Update user preferences

## Database Schema

The application uses the following main models:
- **User**: Authentication and profile data
- **Task**: User tasks with status, priority, and estimates
- **PomodoroSession**: Timer sessions linked to tasks
- **Settings**: User preferences and webhook configuration
- **WebhookDelivery**: Webhook delivery tracking with retry logic

## Webhook Integration

Configure webhook URLs in settings to automatically sync completed Pomodoro sessions to external calendar systems. Supports HMAC signature verification for security.

Built with ❤️ for productivity enthusiasts.

---
*Deployment Status: Environment variables configured ✅*