# Fast Focus - Pomodoro Task Manager

> Plan fast. Focus deep.

A lightning-fast personal task manager with Pomodoro technique integration. Built with Next.js, TypeScript, and modern web technologies.

## ✨ Features

- **🚀 Quick Task Creation**: Add tasks with smart syntax (`#tags`, `!priority`, `~estimates`)
- **🍅 Pomodoro Timer**: Distraction-free focus sessions with accurate timers
- **🔗 Webhook Integration**: Auto-sync to your n8n workflows and calendar
- **⌨️ Keyboard Shortcuts**: Lightning-fast navigation (Q for quick add)
- **📊 Analytics**: Track productivity and focus patterns
- **🔄 Offline Support**: Queued webhook delivery with retry logic
- **🔐 Secure**: Google OAuth + HMAC webhook signatures

## 🏗️ Architecture

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js, Prisma ORM
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Auth**: Google OAuth via NextAuth.js
- **Webhooks**: Idempotent delivery with exponential backoff

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Google OAuth credentials
- Optional: n8n instance for webhook integration

### 1. Installation

```bash
cd fast-focus-pomodoro
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
# Database (SQLite for development)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# App
APP_VERSION="1.0.0"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed demo data (optional)
npm run db:seed
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://yourdomain.com/api/auth/callback/google` (prod)

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

## 📝 Usage

### Quick Task Creation

Use smart syntax in the task input:

```
Write spec #deepwork !high ~2
```

- `#deepwork` → adds "deepwork" tag
- `!high` → sets HIGH priority  
- `~2` → estimates 2 pomodoros

### Keyboard Shortcuts

- `Q` - Open quick add
- `Enter` - Create task
- `Cmd/Ctrl+Enter` - Create task and start pomodoro
- `Space` - Start/pause timer (when focused)
- `Esc` - Cancel current action

### Pomodoro Sessions

1. Select a task (optional)
2. Click "Start Focus Time"
3. Work for 25 minutes
4. Take automatic break (5min short, 15min long every 4 sessions)
5. Webhooks fire automatically to your n8n instance

## 🔗 Webhook Integration

### Setup n8n Integration

1. Create n8n workflow with webhook trigger
2. Add webhook URL in Settings
3. Generate webhook secret for security
4. Test connection

### Webhook Events

All webhooks include HMAC signature for security:

```typescript
// Event types
'pomodoro.started' | 'pomodoro.completed' | 'pomodoro.canceled' 
| 'break.started' | 'break.completed' | 'task.completed'

// Example payload
{
  "event": "pomodoro.completed",
  "user_id": "user_123",
  "session_id": "session_456",
  "task": { "id": "task_789", "title": "Write spec" },
  "start_at": "2025-09-07T10:00:00Z",
  "end_at": "2025-09-07T10:25:00Z",
  "duration_planned_sec": 1500,
  "duration_actual_sec": 1492,
  "timezone": "America/New_York",
  "app_version": "1.0.0"
}
```

## 🗃️ Database Schema

### Core Models

- **User**: OAuth profile + timezone
- **Settings**: Pomodoro lengths, webhook config  
- **Task**: Title, priority, tags, estimates, status
- **PomodoroSession**: Timer sessions with start/end times
- **WebhookDelivery**: Reliable delivery tracking

## 📊 API Reference

### Tasks
```
GET    /api/tasks?filter=today|all|completed&search=query
POST   /api/tasks
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
```

### Pomodoro
```
POST /api/pomodoro/start    # Start session
POST /api/pomodoro/complete # Complete session  
POST /api/pomodoro/cancel   # Cancel session
```

### Settings & Webhooks
```
GET   /api/settings
PATCH /api/settings
POST  /api/settings/webhook/test
```

## 🛠️ Development

### Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/          # React components
├── lib/                 # Utilities (auth, prisma, webhook)
└── types/               # TypeScript definitions

prisma/
├── schema.prisma        # Database schema
└── seed.ts             # Demo data
```

### Database Commands

```bash
npm run db:studio       # Open Prisma Studio
npm run db:reset        # Reset database
npm run db:migrate      # Create migration
npm run db:seed         # Seed demo data
```

Built with ❤️ for productivity enthusiasts and deep work advocates.