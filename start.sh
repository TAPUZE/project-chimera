#!/bin/bash

# Project Chimera - Development Setup Script

echo "🚀 Setting up Project Chimera..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your API keys."
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs uploads ssl

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Show logs
echo "📊 Showing recent logs..."
docker-compose logs --tail=50

echo "✅ Project Chimera is ready!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo "💾 Database: localhost:5432"
echo "🔴 Redis: localhost:6379"

echo ""
echo "🔑 Default credentials:"
echo "Username: admin"
echo "Password: admin"
echo ""
echo "📝 To stop the services: docker-compose down"
echo "🔄 To view logs: docker-compose logs -f"
