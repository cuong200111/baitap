#!/bin/bash

echo "🚀 Starting HACOM Backend Server..."
echo "=================================="

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Navigate to backend directory
cd backend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in backend directory!"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found in backend directory!"
    echo "Please ensure database and environment variables are configured."
fi

# Start the development server
echo "🔄 Starting backend development server on port 4000..."
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
