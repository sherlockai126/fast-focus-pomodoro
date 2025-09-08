# Deployment Guide for Fast Focus Pomodoro

## Prerequisites

1. **PostgreSQL Database** (Supabase, Neon, or any PostgreSQL provider)
2. **Google OAuth Credentials**
3. **Vercel Account** (or any Node.js hosting)

## Environment Variables

Create these environment variables in your deployment platform:

```env
# Database
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="https://your-domain.vercel.app"  # Your production URL
NEXTAUTH_SECRET="[generate-with-openssl-rand-base64-32]"  # Generate secure secret

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Setup Steps

### 1. Database Setup

#### Using Supabase:
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → Database
3. Copy the connection string (use "Transaction" mode)
4. Replace `[YOUR-PASSWORD]` with your database password

#### Using Neon:
1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string from the dashboard

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for local dev)
   - `https://your-domain.vercel.app/api/auth/callback/google` (for production)
7. Copy Client ID and Client Secret

### 3. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
```

#### Option B: Using GitHub Integration
1. Push code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables in project settings
4. Deploy

### 4. Database Migration

After deployment, run migrations:

```bash
# Connect to your database and run
npx prisma migrate deploy

# Or use Prisma's database push for initial setup
npx prisma db push
```

## Post-Deployment Checklist

- [ ] Database connected and tables created
- [ ] Google OAuth working
- [ ] Anonymous timer working on homepage
- [ ] Sign-in flow working
- [ ] Session migration from anonymous to authenticated working
- [ ] Task creation and management working
- [ ] Pomodoro timer functioning

## Troubleshooting

### "Database connection failed"
- Check DATABASE_URL format
- Ensure database is accessible from Vercel's IP
- Check SSL settings (add `?sslmode=require` if needed)

### "Google Sign-in not working"
- Verify redirect URIs in Google Console
- Check NEXTAUTH_URL matches your domain
- Ensure NEXTAUTH_SECRET is set

### "Build failing on Vercel"
- Check build logs for specific errors
- Ensure `prisma generate` runs during build
- Verify all environment variables are set

## Security Notes

1. **NEXTAUTH_SECRET**: Generate with `openssl rand -base64 32`
2. **Database**: Use connection pooling for production
3. **CORS**: Configure if adding external integrations
4. **Rate Limiting**: Consider adding for API routes

## Support

For issues, check:
- Vercel deployment logs
- Browser console for client-side errors
- Vercel Functions logs for API errors
- Database logs for connection issues
