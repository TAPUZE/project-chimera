# Project Chimera - AI Builder System

A comprehensive multi-agent AI system with autonomous agents, task management, learning capabilities, and web interface.

## 🚀 Features

- **Multi-Agent Architecture**: Specialized AI agents for different tasks
- **Task Management**: Intelligent task decomposition and assignment
- **Learning & Adaptation**: Continuous improvement through feedback
- **Real-time Collaboration**: WebSocket-based communication
- **Modern UI**: React-based dashboard with real-time updates
- **Scalable Backend**: FastAPI with async support
- **Multiple AI Models**: OpenAI, local LLMs, and custom models

## 🏗️ Architecture

```
ai-builder/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── agents/         # AI agent implementations
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Core configuration
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── tests/              # Backend tests
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # Redux store
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json        # Node.js dependencies
├── docker-compose.yml      # Docker configuration
├── .env.example           # Environment variables template
└── README.md              # This file
```

## 🛠️ Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker (optional)
- Redis (for task queue)
- PostgreSQL (or SQLite for development)

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Docker Setup
```bash
docker-compose up -d
```

## 🔧 Configuration

1. Copy `.env.example` to `.env`
2. Configure your API keys and database settings
3. Set up Redis for task queue
4. Configure AI model providers

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Agent System](./docs/agents.md)
- [Task Management](./docs/tasks.md)
- [Deployment Guide](./docs/deployment.md)

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

See [Deployment Guide](./docs/deployment.md) for production deployment instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
