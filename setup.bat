@echo off
echo 🚀 ERP Backend Database Setup
echo ==============================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Check if .env file exists
if not exist .env (
    echo 📝 Creating .env file from template...
    copy env.example .env
    echo ⚠️  Please update .env file with your Stripe test keys
    echo    Get them from: https://dashboard.stripe.com/test/apikeys
) else (
    echo ✅ .env file exists
)

REM Start database services
echo 🐘 Starting PostgreSQL and Redis...
npm run db:setup

REM Wait for database to be ready
echo ⏳ Waiting for database to be ready...
timeout /t 10 /nobreak >nul

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
) else (
    echo ✅ Dependencies already installed
)

REM Seed the database
echo 🌱 Seeding database with test data...
npm run seed

echo.
echo 🎉 Setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Update .env file with your Stripe test keys
echo 2. Start the application: npm run start:dev
echo 3. Test the API at: http://localhost:3000
echo.
echo 🔑 Test credentials:
echo    Admin: admin@erp.com / admin123
echo    Customer: john.doe@example.com / customer123
echo.
echo 📚 See DATABASE_SETUP.md for detailed instructions
pause
