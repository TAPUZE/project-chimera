from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from contextlib import asynccontextmanager
import uvicorn
import logging
from typing import List

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import auth, agents, tasks, chat, analytics
from app.services.websocket_manager import WebSocketManager
from app.services.agent_manager import AgentManager
from app.core.logging import setup_logging

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Initialize managers
websocket_manager = WebSocketManager()
agent_manager = AgentManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    logger.info("Starting up Project Chimera...")
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    
    # Initialize agent manager
    await agent_manager.initialize()
    
    logger.info("Project Chimera started successfully!")
    yield
    
    # Cleanup
    logger.info("Shutting down Project Chimera...")
    await agent_manager.cleanup()
    logger.info("Project Chimera shutdown complete!")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="A comprehensive multi-agent AI system",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["Agents"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["Tasks"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "status": "online"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    from app.services.ai_client import AIClient
    
    # Test AI client connections
    ai_client = AIClient()
    await ai_client.initialize()
    api_status = await ai_client.validate_api_keys()
    
    return {
        "status": "healthy",
        "timestamp": "2025-07-10T00:00:00Z",
        "services": {
            "database": "connected",
            "redis": "connected",
            "agents": f"{len(agent_manager.agents)} active"
        },
        "ai_providers": {
            "openai": "connected" if api_status.get("openai") else "disconnected",
            "anthropic": "connected" if api_status.get("anthropic") else "disconnected",
            "gemini": "connected" if api_status.get("gemini") else "disconnected"
        },
        "available_models": [
            "gpt-4", "gpt-3.5-turbo", 
            "claude-3-opus", "claude-3-sonnet", "claude-3-haiku",
            "gemini-pro", "gemini-pro-vision"
        ]
    }

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time communication."""
    await websocket_manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket_manager.handle_message(client_id, data)
    except WebSocketDisconnect:
        websocket_manager.disconnect(client_id)

# Make managers available to other modules
app.state.websocket_manager = websocket_manager
app.state.agent_manager = agent_manager

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
