# Project Chimera - Development Setup

## Quick Start (Windows)

1. **Prerequisites**
   - Install Docker Desktop
   - Install Git
   - Have your API keys ready (OpenAI, Anthropic)

2. **Setup**
   ```bash
   # Clone and enter the project directory
   cd "C:\Users\User\OneDrive\Desktop\ai builder"
   
   # Run the setup script
   start.bat
   ```

3. **Manual Setup (Alternative)**
   ```bash
   # Copy environment file
   copy .env.example .env
   
   # Edit .env file with your API keys
   notepad .env
   
   # Start with Docker Compose
   docker-compose up -d --build
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Development Setup

### Backend Development
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

## Features

- **Multi-Agent System**: Create and manage AI agents with different capabilities
- **Task Management**: Assign tasks to agents and track progress
- **Real-time Chat**: Communicate with AI agents in real-time
- **Analytics Dashboard**: Monitor agent performance and system metrics
- **WebSocket Support**: Real-time updates and notifications
- **Modern UI**: React-based interface with Material-UI components

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user

### Agents
- `GET /api/v1/agents` - List agents
- `POST /api/v1/agents` - Create agent
- `GET /api/v1/agents/{id}` - Get agent details
- `PUT /api/v1/agents/{id}` - Update agent
- `DELETE /api/v1/agents/{id}` - Delete agent

### Tasks
- `GET /api/v1/tasks` - List tasks
- `POST /api/v1/tasks` - Create task
- `GET /api/v1/tasks/{id}` - Get task details
- `PUT /api/v1/tasks/{id}` - Update task
- `POST /api/v1/tasks/{id}/execute` - Execute task

### Chat
- `GET /api/v1/chat/sessions` - List chat sessions
- `POST /api/v1/chat/sessions` - Create chat session
- `GET /api/v1/chat/sessions/{id}/messages` - Get messages
- `POST /api/v1/chat/completions` - Generate response

### Analytics
- `GET /api/v1/analytics/overview` - System overview
- `GET /api/v1/analytics/agents/performance` - Agent performance
- `GET /api/v1/analytics/tasks/analytics` - Task analytics

## Environment Variables

Key environment variables to set in `.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/chimera_db

# Redis
REDIS_URL=redis://localhost:6379/0

# AI APIs
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GEMINI_API_KEY=your_gemini_api_key

# Security
JWT_SECRET_KEY=your_jwt_secret_key
SECRET_KEY=your_secret_key

# Application
DEBUG=true
HOST=0.0.0.0
PORT=8000
```

## Supported AI Models

Project Chimera supports multiple AI providers:

### OpenAI Models
- **GPT-4**: Most capable model for complex tasks
- **GPT-3.5 Turbo**: Fast and efficient for most tasks

### Anthropic Models
- **Claude 3 Opus**: Most capable Claude model
- **Claude 3 Sonnet**: Balanced performance and speed
- **Claude 3 Haiku**: Fastest Claude model

### Google Models
- **Gemini Pro**: Google's most capable model
- **Gemini Pro Vision**: Gemini with vision capabilities

You can switch between models when creating agents or in the chat interface.

## Docker Services

The application includes these services:

- **PostgreSQL**: Database for storing application data
- **Redis**: Cache and task queue
- **Backend**: FastAPI application
- **Frontend**: React application
- **Nginx**: Reverse proxy (optional)

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in docker-compose.yml
2. **Database connection**: Ensure PostgreSQL is running
3. **API keys**: Verify API keys are set correctly
4. **Dependencies**: Run `pip install -r requirements.txt` or `npm install`

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Reset Database
```bash
# Stop services
docker-compose down

# Remove volumes
docker-compose down -v

# Restart
docker-compose up -d --build
```

## Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload in development
2. **API Testing**: Use the interactive docs at http://localhost:8000/docs
3. **Database**: Use a database client to connect to PostgreSQL
4. **Debugging**: Enable DEBUG mode in .env for detailed logs

## Production Deployment

For production deployment:

1. Set `DEBUG=false` in environment
2. Use a production database
3. Configure proper SSL certificates
4. Set up monitoring and logging
5. Use environment-specific configurations

## Support

For issues or questions:
1. Check the logs: `docker-compose logs -f`
2. Review the API documentation: http://localhost:8000/docs
3. Ensure all environment variables are set correctly
