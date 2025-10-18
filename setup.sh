#!/bin/bash

echo "🚀 ERP Backend Database Setup"
echo "=============================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update .env file with your Stripe test keys"
    echo "   Get them from: https://dashboard.stripe.com/test/apikeys"
else
    echo "✅ .env file exists"
fi

# Start database services
echo "🐘 Starting PostgreSQL and Redis..."
npm run db:setup

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Seed the database
echo "🌱 Seeding database with test data..."
npm run seed

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your Stripe test keys"
echo "2. Start the application: npm run start:dev"
echo "3. Test the API at: http://localhost:3000"
echo ""
echo "🔑 Test credentials:"
echo "   Admin: admin@erp.com / admin123"
echo "   Customer: john.doe@example.com / customer123"
echo ""
echo "📚 See DATABASE_SETUP.md for detailed instructions"
