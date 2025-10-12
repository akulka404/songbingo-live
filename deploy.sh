#!/bin/bash

# Deployment script for SongBingo.live to Vercel

echo "🎵 Deploying SongBingo.live to Vercel..."

# Check if .env.local exists for local development
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Make sure to set environment variables in Vercel dashboard:"
    echo "   - MONGODB_URI"
    echo "   - PUSHER_APP_ID"
    echo "   - PUSHER_KEY"
    echo "   - PUSHER_SECRET"
    echo "   - PUSHER_CLUSTER"
    echo "   - JWT_SECRET"
fi

# Install Vercel CLI if not available
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your SongBingo.live app is now live!"