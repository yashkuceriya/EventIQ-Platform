#!/bin/bash

# Start all services for development

echo "🚀 Starting EventIQ Platform..."

# Start Docker services
echo "📦 Starting Docker infrastructure..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 10

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
cd packages/database
pnpm db:generate
cd ../..

# Run migrations
echo "📊 Running database migrations..."
cd packages/database
pnpm db:migrate
cd ../..

echo "✅ Infrastructure ready!"
echo ""
echo "Start development servers:"
echo "1. Terminal 1: cd apps/event-ingestion-service && pnpm dev"
echo "2. Terminal 2: cd apps/ai-analysis-service && pnpm dev"
echo "3. Terminal 3: cd apps/analytics-service && pnpm dev"
echo "4. Terminal 4: cd apps/web && pnpm dev"
