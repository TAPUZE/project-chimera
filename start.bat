@echo off
echo 🚀 Setting up Project Chimera...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file...
    copy .env.example .env
    echo ✅ .env file created. Please update it with your API keys.
)

REM Create necessary directories
echo 📁 Creating directories...
if not exist logs mkdir logs
if not exist uploads mkdir uploads
if not exist ssl mkdir ssl

REM Build and start services
echo 🔨 Building and starting services...
docker-compose up -d --build

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak

REM Check if services are running
echo 🔍 Checking service status...
docker-compose ps

REM Show logs
echo 📊 Showing recent logs...
docker-compose logs --tail=50

echo ✅ Project Chimera is ready!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8000
echo 📚 API Documentation: http://localhost:8000/docs
echo 💾 Database: localhost:5432
echo 🔴 Redis: localhost:6379
echo.
echo 🔑 Default credentials:
echo Username: admin
echo Password: admin
echo.
echo 📝 To stop the services: docker-compose down
echo 🔄 To view logs: docker-compose logs -f

pause
