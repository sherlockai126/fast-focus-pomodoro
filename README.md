# Fast Focus Pomodoro

A lightning-fast personal task manager with Pomodoro technique. Start focusing immediately without sign-in, and optionally sync your sessions with Google Calendar.

## 🚀 Key Features

### Instant Start - No Sign-in Required
- **Start Immediately**: Open the app and start your Pomodoro timer instantly
- **Local Storage**: All sessions are saved in your browser's local storage
- **Anonymous Usage**: Use all core features without creating an account

### Optional Sign-in Benefits
- **Google Sign-in**: Sign in with Google to unlock additional features
- **Session Sync**: Automatically migrate your anonymous sessions to your account
- **Google Calendar Integration**: Sync completed sessions with your calendar
- **Cross-Device Access**: Access your sessions from any device

## 💡 How It Works

1. **Visit the app** - Start using the Pomodoro timer immediately
2. **Track Sessions** - Your focus sessions are saved locally in your browser
3. **Sign in (Optional)** - Click "Sign in with Google" when you want to:
   - Save your session history permanently
   - Sync with Google Calendar
   - Access from multiple devices

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: Prisma with PostgreSQL
- **Deployment**: Vercel

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/sherlockai126/fast-focus-pomodoro.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

## 🔧 Environment Variables

Create a `.env.local` file with:

```env
DATABASE_URL="your-database-url"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## 🎯 Usage

### Anonymous User Flow
1. Open the app - Pomodoro timer is ready to use
2. Enter task name (optional)
3. Start timer
4. Sessions are saved locally

### Authenticated User Flow
1. Click "Sign in with Google"
2. Your anonymous sessions are migrated
3. Access full dashboard with:
   - Task management
   - Statistics
   - Calendar sync
   - Settings

## 📊 Features Comparison

| Feature | Anonymous | Signed In |
|---------|-----------|-----------|
| Pomodoro Timer | ✅ | ✅ |
| Session Tracking | ✅ (Local) | ✅ (Cloud) |
| Task Management | Basic | Full |
| Statistics | Today Only | All Time |
| Calendar Sync | ❌ | ✅ |
| Cross-Device | ❌ | ✅ |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.