from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.core.database import get_db, Task, Agent, User
from app.api.v1.auth import get_current_user
from app.services.task_manager import TaskManager

router = APIRouter()

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    task_type: str = Field(..., description="Type of task to perform")
    priority: str = Field(default="medium", description="Task priority (low, medium, high, urgent)")
    input_data: Optional[Dict[str, Any]] = None
    agent_id: Optional[int] = None
    parent_task_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    agent_id: Optional[int] = None
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    progress: Optional[float] = Field(None, ge=0, le=100)

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    task_type: str
    priority: str
    status: str
    input_data: Optional[Dict[str, Any]]
    output_data: Optional[Dict[str, Any]]
    progress: float
    agent_id: Optional[int]
    user_id: int
    parent_task_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]

class TaskExecution(BaseModel):
    task_id: int
    agent_id: Optional[int] = None
    parameters: Optional[Dict[str, Any]] = None

class TaskResult(BaseModel):
    task_id: int
    status: str
    result: Optional[Dict[str, Any]]
    error: Optional[str]
    execution_time: float
    timestamp: datetime

@router.post("/", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new task."""
    # Validate task type
    valid_types = ["research", "analysis", "generation", "classification", "summary", "custom"]
    if task_data.task_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid task type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Validate priority
    valid_priorities = ["low", "medium", "high", "urgent"]
    if task_data.priority not in valid_priorities:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid priority. Must be one of: {', '.join(valid_priorities)}"
        )
    
    # Validate agent if specified
    if task_data.agent_id:
        agent = db.query(Agent).filter(
            Agent.id == task_data.agent_id,
            Agent.owner_id == current_user.id,
            Agent.is_active == True
        ).first()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found or inactive"
            )
    
    # Validate parent task if specified
    if task_data.parent_task_id:
        parent_task = db.query(Task).filter(
            Task.id == task_data.parent_task_id,
            Task.user_id == current_user.id
        ).first()
        if not parent_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent task not found"
            )
    
    # Create task
    task = Task(
        title=task_data.title,
        description=task_data.description,
        task_type=task_data.task_type,
        priority=task_data.priority,
        input_data=task_data.input_data,
        agent_id=task_data.agent_id,
        parent_task_id=task_data.parent_task_id,
        user_id=current_user.id
    )
    
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return task

@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    task_type: Optional[str] = None
):
    """Get all tasks for the current user."""
    query = db.query(Task).filter(Task.user_id == current_user.id)
    
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if task_type:
        query = query.filter(Task.task_type == task_type)
    
    tasks = query.offset(skip).limit(limit).all()
    return tasks

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific task."""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a task."""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Update fields
    update_data = task_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    
    # Set completed_at if status is completed
    if task_data.status == "completed":
        task.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(task)
    
    return task

@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a task."""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    db.delete(task)
    db.commit()
    
    return {"message": "Task deleted successfully"}

@router.post("/{task_id}/execute", response_model=TaskResult)
async def execute_task(
    task_id: int,
    execution_data: TaskExecution,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Execute a task."""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Update task status
    task.status = "in_progress"
    db.commit()
    
    try:
        # Execute task using task manager
        task_manager = TaskManager()
        result = await task_manager.execute_task(task, execution_data.parameters)
        
        # Update task with result
        task.status = "completed"
        task.output_data = result.get("output_data")
        task.progress = 100.0
        task.completed_at = datetime.utcnow()
        db.commit()
        
        return TaskResult(
            task_id=task_id,
            status="completed",
            result=result,
            error=None,
            execution_time=result.get("execution_time", 0.0),
            timestamp=datetime.utcnow()
        )
    
    except Exception as e:
        # Update task with error
        task.status = "failed"
        task.output_data = {"error": str(e)}
        db.commit()
        
        return TaskResult(
            task_id=task_id,
            status="failed",
            result=None,
            error=str(e),
            execution_time=0.0,
            timestamp=datetime.utcnow()
        )

@router.get("/{task_id}/subtasks", response_model=List[TaskResponse])
async def get_subtasks(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get subtasks for a task."""
    # Verify parent task exists and belongs to user
    parent_task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not parent_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent task not found"
        )
    
    subtasks = db.query(Task).filter(
        Task.parent_task_id == task_id
    ).all()
    
    return subtasks

@router.post("/{task_id}/cancel")
async def cancel_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a task."""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    if task.status in ["completed", "failed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel completed or failed task"
        )
    
    task.status = "cancelled"
    db.commit()
    
    return {"message": "Task cancelled successfully"}

@router.get("/types/available")
async def get_available_task_types():
    """Get available task types and their descriptions."""
    return {
        "types": [
            {
                "type": "research",
                "name": "Research Task",
                "description": "Gather and analyze information from various sources"
            },
            {
                "type": "analysis",
                "name": "Data Analysis",
                "description": "Analyze data and extract insights"
            },
            {
                "type": "generation",
                "name": "Content Generation",
                "description": "Generate text, code, or other content"
            },
            {
                "type": "classification",
                "name": "Classification",
                "description": "Classify or categorize items"
            },
            {
                "type": "summary",
                "name": "Summarization",
                "description": "Summarize text or information"
            },
            {
                "type": "custom",
                "name": "Custom Task",
                "description": "Custom task with specific requirements"
            }
        ]
    }
