# Deployment Guide - Fast Focus Pomodoro Chat

## 🚀 Vercel Deployment with Supabase

### Prerequisites
- [Vercel Account](https://vercel.com)
- [Supabase Project](https://supabase.com)
- GitHub repository connected

### Step 1: Supabase Setup

1. **Get your Supabase Database URL**:
   - Go to your Supabase project dashboard
   - Navigate to Settings → Database
   - Copy the connection string under "Connection String"
   - Format: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`

### Step 2: Deploy to Vercel

1. **Connect GitHub Repository**:
   ```bash
   # Push your changes to GitHub first
   git add .
   git commit -m "Configure for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your GitHub repository
   - Choose "Next.js" framework preset

3. **Configure Environment Variables**:
   Add these in Vercel dashboard → Settings → Environment Variables:
   
   ```env
   DATABASE_URL=your-supabase-connection-string
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-secret-key-here
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically run `vercel-build` which includes:
     - `prisma generate`
     - `prisma migrate deploy`
     - `next build`

### Step 3: Post-Deployment Setup

1. **Verify Database Migration**:
   - Check Vercel deployment logs
   - Ensure Prisma migrations ran successfully
   - Verify tables were created in Supabase

2. **Test Authentication**:
   - Update Google OAuth redirect URIs to include your Vercel domain
   - Test login functionality

3. **Test Chat Features**:
   - Create test users
   - Test real-time messaging
   - Verify database persistence

### Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase PostgreSQL connection string | `postgresql://postgres:pass@db.ref.supabase.co:5432/postgres` |
| `NEXTAUTH_URL` | Your deployed app URL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Random secret for NextAuth.js | Generate with: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | From Google Cloud Console |

### Automatic Deployments

Every push to your main branch will trigger a new deployment with:
- ✅ Automatic Prisma client generation
- ✅ Database migrations
- ✅ Next.js build optimization
- ✅ Environment variable injection

### Troubleshooting

**Database Connection Issues**:
- Verify Supabase connection string format
- Check if password contains special characters (URL encode them)
- Ensure Supabase project is not paused

**Migration Issues**:
- Check Vercel function logs
- Verify DATABASE_URL is set correctly
- Ensure Supabase allows connections from Vercel IPs

**OAuth Issues**:
- Update redirect URIs in Google Cloud Console
- Add your Vercel domain to authorized domains
- Verify NEXTAUTH_URL matches your deployment

### Manual Migration (if needed)

If automatic migration fails, you can run manually:

```bash
# Connect to your deployed project
vercel env pull .env.production

# Run migration locally pointing to production DB
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

### Socket.io Limitations

Note: Vercel serverless functions don't support persistent WebSocket connections. For full Socket.io functionality, consider:

1. **Alternative 1**: Use WebSocket services like Pusher or Ably
2. **Alternative 2**: Deploy to platforms supporting WebSockets (Railway, Render)
3. **Alternative 3**: Implement polling as fallback

The chat application will work without Socket.io but without real-time features.

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run database migration
npm run db:migrate

# Start development server
npm run dev
```

## 📦 Production Build

```bash
# Test production build locally
npm run build
npm run start
```

Your chat application should now be live on Vercel! 🎉