#!/bin/bash

# SLEX Platform Production Deploy Script
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="slex-platform"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"

echo "🚀 Starting SLEX Platform deployment..."
echo "Environment: $ENVIRONMENT"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "📝 Please edit .env file with your production values"
        echo "   Then run this script again."
        exit 1
    else
        echo "❌ No env.example file found. Please create .env file manually."
        exit 1
    fi
fi

# Backup current deployment (if exists)
if docker ps -q -f name=${PROJECT_NAME} > /dev/null 2>&1; then
    echo "📦 Creating backup..."
    docker-compose -f $DOCKER_COMPOSE_FILE exec app node scripts/backup.js || true
fi

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Build and deploy
echo "🔨 Building Docker images..."
docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache

echo "🚀 Starting services..."
docker-compose -f $DOCKER_COMPOSE_FILE up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check if services are running
if docker-compose -f $DOCKER_COMPOSE_FILE ps | grep -q "Up"; then
    echo "✅ Services are running successfully!"
    
    # Run database migrations/seeding if needed
    echo "🌱 Running database setup..."
    docker-compose -f $DOCKER_COMPOSE_FILE exec app node scripts/comprehensive-seeder.js || true
    
    # Show service status
    echo "📊 Service Status:"
    docker-compose -f $DOCKER_COMPOSE_FILE ps
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo "🌐 Application is available at: https://yourdomain.com"
    echo "📊 Health check: https://yourdomain.com/health"
    echo ""
    echo "📝 Useful commands:"
    echo "   View logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
    echo "   Restart: docker-compose -f $DOCKER_COMPOSE_FILE restart"
    echo "   Stop: docker-compose -f $DOCKER_COMPOSE_FILE down"
    
else
    echo "❌ Deployment failed. Check logs:"
    docker-compose -f $DOCKER_COMPOSE_FILE logs
    exit 1
fi
