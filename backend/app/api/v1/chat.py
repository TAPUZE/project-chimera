from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.core.database import get_db, ChatSession, ChatMessage, Agent, User
from app.api.v1.auth import get_current_user
from app.services.chat_manager import ChatManager

router = APIRouter()

class ChatSessionCreate(BaseModel):
    title: Optional[str] = None

class ChatSessionResponse(BaseModel):
    id: int
    title: Optional[str]
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
    agent_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    agent_id: Optional[int]
    content: str
    message_type: str
    metadata: Optional[Dict[str, Any]]
    created_at: datetime

class ChatCompletionRequest(BaseModel):
    message: str = Field(..., min_length=1)
    agent_id: Optional[int] = None
    session_id: Optional[int] = None
    temperature: Optional[float] = Field(default=0.7, ge=0, le=2)
    max_tokens: Optional[int] = Field(default=1000, gt=0, le=4000)
    stream: bool = False

class ChatCompletionResponse(BaseModel):
    message: str
    agent_id: Optional[int]
    session_id: int
    metadata: Optional[Dict[str, Any]]
    timestamp: datetime

@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    session_data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new chat session."""
    session = ChatSession(
        title=session_data.title or f"Chat Session {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        user_id=current_user.id
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return session

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all chat sessions for the current user."""
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.updated_at.desc()).offset(skip).limit(limit).all()
    
    return sessions

@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific chat session."""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    return session

@router.put("/sessions/{session_id}", response_model=ChatSessionResponse)
async def update_chat_session(
    session_id: int,
    session_data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a chat session."""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    if session_data.title:
        session.title = session_data.title
    
    db.commit()
    db.refresh(session)
    
    return session

@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a chat session."""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    db.delete(session)
    db.commit()
    
    return {"message": "Chat session deleted successfully"}

@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
async def get_chat_messages(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get messages for a chat session."""
    # Verify session exists and belongs to user
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at.asc()).offset(skip).limit(limit).all()
    
    return messages

@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def add_chat_message(
    session_id: int,
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a message to a chat session."""
    # Verify session exists and belongs to user
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    # Verify agent if specified
    if message_data.agent_id:
        agent = db.query(Agent).filter(
            Agent.id == message_data.agent_id,
            Agent.owner_id == current_user.id
        ).first()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found"
            )
    
    message = ChatMessage(
        session_id=session_id,
        agent_id=message_data.agent_id,
        content=message_data.content,
        message_type="user",
        metadata=message_data.metadata
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    # Update session timestamp
    session.updated_at = datetime.utcnow()
    db.commit()
    
    return message

@router.post("/completions", response_model=ChatCompletionResponse)
async def chat_completion(
    request: ChatCompletionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a chat completion using an AI agent."""
    # Get or create session
    session = None
    if request.session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == request.session_id,
            ChatSession.user_id == current_user.id
        ).first()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
    else:
        # Create new session
        session = ChatSession(
            title=f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            user_id=current_user.id
        )
        db.add(session)
        db.commit()
        db.refresh(session)
    
    # Get agent
    agent = None
    if request.agent_id:
        agent = db.query(Agent).filter(
            Agent.id == request.agent_id,
            Agent.owner_id == current_user.id,
            Agent.is_active == True
        ).first()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found or inactive"
            )
    
    # Save user message
    user_message = ChatMessage(
        session_id=session.id,
        content=request.message,
        message_type="user"
    )
    db.add(user_message)
    db.commit()
    
    try:
        # Generate response using chat manager
        chat_manager = ChatManager()
        response = await chat_manager.generate_response(
            message=request.message,
            agent=agent,
            session_id=session.id,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        # Save AI response
        ai_message = ChatMessage(
            session_id=session.id,
            agent_id=agent.id if agent else None,
            content=response["content"],
            message_type="agent",
            metadata=response.get("metadata")
        )
        db.add(ai_message)
        db.commit()
        
        # Update session timestamp
        session.updated_at = datetime.utcnow()
        db.commit()
        
        return ChatCompletionResponse(
            message=response["content"],
            agent_id=agent.id if agent else None,
            session_id=session.id,
            metadata=response.get("metadata"),
            timestamp=datetime.utcnow()
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating response: {str(e)}"
        )

@router.get("/sessions/{session_id}/export")
async def export_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export a chat session as JSON."""
    # Verify session exists and belongs to user
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    # Get all messages
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at.asc()).all()
    
    export_data = {
        "session": {
            "id": session.id,
            "title": session.title,
            "created_at": session.created_at.isoformat(),
            "updated_at": session.updated_at.isoformat()
        },
        "messages": [
            {
                "id": msg.id,
                "content": msg.content,
                "message_type": msg.message_type,
                "agent_id": msg.agent_id,
                "metadata": msg.metadata,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]
    }
    
    return export_data
