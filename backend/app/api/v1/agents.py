from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.core.database import get_db, Agent, User
from app.api.v1.auth import get_current_user
from app.services.agent_manager import AgentManager

router = APIRouter()

class AgentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    agent_type: str = Field(..., description="Type of agent (researcher, analyst, creative, etc.)")
    model: str = Field(default="gpt-4", description="AI model to use")
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=4000, gt=0, le=8000)
    system_prompt: Optional[str] = None
    capabilities: Optional[Dict[str, Any]] = None
    config: Optional[Dict[str, Any]] = None

class AgentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0, le=2)
    max_tokens: Optional[int] = Field(None, gt=0, le=8000)
    system_prompt: Optional[str] = None
    capabilities: Optional[Dict[str, Any]] = None
    config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class AgentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    agent_type: str
    model: str
    temperature: float
    max_tokens: int
    system_prompt: Optional[str]
    capabilities: Optional[Dict[str, Any]]
    config: Optional[Dict[str, Any]]
    is_active: bool
    owner_id: int
    created_at: datetime
    updated_at: datetime

class AgentStatus(BaseModel):
    agent_id: int
    status: str
    current_task: Optional[str] = None
    uptime: int
    memory_usage: float
    cpu_usage: float
    last_activity: datetime

@router.post("/", response_model=AgentResponse)
async def create_agent(
    agent_data: AgentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new AI agent."""
    # Validate agent type
    valid_types = ["researcher", "analyst", "creative", "assistant", "specialist"]
    if agent_data.agent_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid agent type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Create agent
    agent = Agent(
        name=agent_data.name,
        description=agent_data.description,
        agent_type=agent_data.agent_type,
        model=agent_data.model,
        temperature=agent_data.temperature,
        max_tokens=agent_data.max_tokens,
        system_prompt=agent_data.system_prompt,
        capabilities=agent_data.capabilities,
        config=agent_data.config,
        owner_id=current_user.id
    )
    
    db.add(agent)
    db.commit()
    db.refresh(agent)
    
    return agent

@router.get("/", response_model=List[AgentResponse])
async def get_agents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all agents for the current user."""
    agents = db.query(Agent).filter(
        Agent.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return agents

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific agent."""
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.owner_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    return agent

@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: int,
    agent_data: AgentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an agent."""
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.owner_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    # Update fields
    update_data = agent_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(agent, field, value)
    
    db.commit()
    db.refresh(agent)
    
    return agent

@router.delete("/{agent_id}")
async def delete_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an agent."""
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.owner_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    db.delete(agent)
    db.commit()
    
    return {"message": "Agent deleted successfully"}

@router.post("/{agent_id}/activate")
async def activate_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Activate an agent."""
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.owner_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    agent.is_active = True
    db.commit()
    
    return {"message": "Agent activated successfully"}

@router.post("/{agent_id}/deactivate")
async def deactivate_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deactivate an agent."""
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.owner_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    agent.is_active = False
    db.commit()
    
    return {"message": "Agent deactivated successfully"}

@router.get("/{agent_id}/status", response_model=AgentStatus)
async def get_agent_status(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get agent status and metrics."""
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.owner_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    # Get status from agent manager
    # This is a placeholder - in a real implementation, you'd get this from the agent manager
    status_data = AgentStatus(
        agent_id=agent_id,
        status="active" if agent.is_active else "inactive",
        current_task=None,
        uptime=0,
        memory_usage=0.0,
        cpu_usage=0.0,
        last_activity=agent.updated_at
    )
    
    return status_data

@router.get("/models/available")
async def get_available_models():
    """Get available AI models and their specifications."""
    return {
        "models": [
            {
                "id": "gpt-4",
                "name": "GPT-4",
                "provider": "OpenAI",
                "description": "Most capable GPT model, best for complex tasks",
                "max_tokens": 4000,
                "supports_vision": False
            },
            {
                "id": "gpt-3.5-turbo",
                "name": "GPT-3.5 Turbo",
                "provider": "OpenAI",
                "description": "Fast and efficient, good for most tasks",
                "max_tokens": 4000,
                "supports_vision": False
            },
            {
                "id": "claude-3-opus",
                "name": "Claude 3 Opus",
                "provider": "Anthropic",
                "description": "Most capable Claude model, excellent for complex reasoning",
                "max_tokens": 4000,
                "supports_vision": True
            },
            {
                "id": "claude-3-sonnet",
                "name": "Claude 3 Sonnet",
                "provider": "Anthropic",
                "description": "Balanced performance and speed",
                "max_tokens": 4000,
                "supports_vision": True
            },
            {
                "id": "claude-3-haiku",
                "name": "Claude 3 Haiku",
                "provider": "Anthropic",
                "description": "Fastest Claude model, good for simple tasks",
                "max_tokens": 4000,
                "supports_vision": True
            },
            {
                "id": "gemini-pro",
                "name": "Gemini Pro",
                "provider": "Google",
                "description": "Google's most capable model, excellent for reasoning",
                "max_tokens": 4000,
                "supports_vision": False
            },
            {
                "id": "gemini-pro-vision",
                "name": "Gemini Pro Vision",
                "provider": "Google",
                "description": "Gemini with vision capabilities",
                "max_tokens": 4000,
                "supports_vision": True
            }
        ]
    }

@router.get("/types/available")
async def get_available_agent_types():
    """Get available agent types and their descriptions."""
    return {
        "types": [
            {
                "type": "researcher",
                "name": "Research Agent",
                "description": "Specialized in gathering and analyzing information from various sources",
                "recommended_models": ["gpt-4", "claude-3-opus", "gemini-pro"]
            },
            {
                "type": "analyst",
                "name": "Data Analyst",
                "description": "Focused on data analysis, pattern recognition, and insights generation",
                "recommended_models": ["gpt-4", "claude-3-sonnet", "gemini-pro"]
            },
            {
                "type": "creative",
                "name": "Creative Agent",
                "description": "Designed for creative tasks like writing, brainstorming, and content generation",
                "recommended_models": ["gpt-4", "claude-3-opus", "gemini-pro"]
            },
            {
                "type": "assistant",
                "name": "General Assistant",
                "description": "Versatile agent for general-purpose tasks and conversations",
                "recommended_models": ["gpt-3.5-turbo", "claude-3-haiku", "gemini-pro"]
            },
            {
                "type": "specialist",
                "name": "Domain Specialist",
                "description": "Customizable agent for specific domain expertise",
                "recommended_models": ["gpt-4", "claude-3-opus", "gemini-pro"]
            }
        ]
    }
