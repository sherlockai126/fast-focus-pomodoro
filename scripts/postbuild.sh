#!/bin/bash

# Post-build script for Vercel deployment
echo "Running post-build tasks..."

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database migrations (only in production)
if [ "$VERCEL_ENV" = "production" ]; then
  echo "Running database migrations..."
  npx prisma migrate deploy
else
  echo "Skipping migrations in non-production environment"
fi

echo "Post-build tasks completed!"