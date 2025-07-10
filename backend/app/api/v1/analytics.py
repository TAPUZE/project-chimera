from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from app.core.database import get_db, Agent, Task, ChatMessage, AgentMetrics, User
from app.api.v1.auth import get_current_user

router = APIRouter()

class AnalyticsOverview(BaseModel):
    total_agents: int
    active_agents: int
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    failed_tasks: int
    total_chat_messages: int
    success_rate: float
    average_task_duration: float

class AgentPerformance(BaseModel):
    agent_id: int
    agent_name: str
    total_tasks: int
    completed_tasks: int
    failed_tasks: int
    success_rate: float
    average_duration: float
    last_activity: Optional[datetime]

class TaskAnalytics(BaseModel):
    task_type: str
    total_tasks: int
    completed_tasks: int
    failed_tasks: int
    success_rate: float
    average_duration: float

class UsageMetrics(BaseModel):
    date: str
    total_tasks: int
    completed_tasks: int
    total_messages: int
    active_agents: int

class SystemMetrics(BaseModel):
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    active_connections: int
    uptime: int

@router.get("/overview", response_model=AnalyticsOverview)
async def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics overview for the current user."""
    
    # Get agent statistics
    total_agents = db.query(Agent).filter(Agent.owner_id == current_user.id).count()
    active_agents = db.query(Agent).filter(
        Agent.owner_id == current_user.id,
        Agent.is_active == True
    ).count()
    
    # Get task statistics
    total_tasks = db.query(Task).filter(Task.user_id == current_user.id).count()
    completed_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status == "completed"
    ).count()
    pending_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status.in_(["pending", "in_progress"])
    ).count()
    failed_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status == "failed"
    ).count()
    
    # Get chat statistics
    total_chat_messages = db.query(ChatMessage).join(
        ChatMessage.session
    ).filter(
        ChatMessage.session.has(user_id=current_user.id)
    ).count()
    
    # Calculate success rate
    success_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    # Calculate average task duration
    completed_tasks_with_duration = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status == "completed",
        Task.completed_at.isnot(None)
    ).all()
    
    total_duration = sum([
        (task.completed_at - task.created_at).total_seconds()
        for task in completed_tasks_with_duration
    ])
    
    average_task_duration = (
        total_duration / len(completed_tasks_with_duration)
        if completed_tasks_with_duration else 0
    )
    
    return AnalyticsOverview(
        total_agents=total_agents,
        active_agents=active_agents,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        pending_tasks=pending_tasks,
        failed_tasks=failed_tasks,
        total_chat_messages=total_chat_messages,
        success_rate=success_rate,
        average_task_duration=average_task_duration
    )

@router.get("/agents/performance", response_model=List[AgentPerformance])
async def get_agent_performance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get performance metrics for all agents."""
    
    agents = db.query(Agent).filter(Agent.owner_id == current_user.id).all()
    performance_data = []
    
    for agent in agents:
        # Get task statistics for this agent
        total_tasks = db.query(Task).filter(
            Task.agent_id == agent.id,
            Task.user_id == current_user.id
        ).count()
        
        completed_tasks = db.query(Task).filter(
            Task.agent_id == agent.id,
            Task.user_id == current_user.id,
            Task.status == "completed"
        ).count()
        
        failed_tasks = db.query(Task).filter(
            Task.agent_id == agent.id,
            Task.user_id == current_user.id,
            Task.status == "failed"
        ).count()
        
        # Calculate success rate
        success_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Calculate average duration
        completed_tasks_with_duration = db.query(Task).filter(
            Task.agent_id == agent.id,
            Task.user_id == current_user.id,
            Task.status == "completed",
            Task.completed_at.isnot(None)
        ).all()
        
        total_duration = sum([
            (task.completed_at - task.created_at).total_seconds()
            for task in completed_tasks_with_duration
        ])
        
        average_duration = (
            total_duration / len(completed_tasks_with_duration)
            if completed_tasks_with_duration else 0
        )
        
        # Get last activity
        last_task = db.query(Task).filter(
            Task.agent_id == agent.id,
            Task.user_id == current_user.id
        ).order_by(desc(Task.updated_at)).first()
        
        performance_data.append(AgentPerformance(
            agent_id=agent.id,
            agent_name=agent.name,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            failed_tasks=failed_tasks,
            success_rate=success_rate,
            average_duration=average_duration,
            last_activity=last_task.updated_at if last_task else None
        ))
    
    return performance_data

@router.get("/tasks/analytics", response_model=List[TaskAnalytics])
async def get_task_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics by task type."""
    
    # Get all task types for the user
    task_types = db.query(Task.task_type).filter(
        Task.user_id == current_user.id
    ).distinct().all()
    
    analytics_data = []
    
    for task_type_row in task_types:
        task_type = task_type_row[0]
        
        # Get statistics for this task type
        total_tasks = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.task_type == task_type
        ).count()
        
        completed_tasks = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.task_type == task_type,
            Task.status == "completed"
        ).count()
        
        failed_tasks = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.task_type == task_type,
            Task.status == "failed"
        ).count()
        
        # Calculate success rate
        success_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Calculate average duration
        completed_tasks_with_duration = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.task_type == task_type,
            Task.status == "completed",
            Task.completed_at.isnot(None)
        ).all()
        
        total_duration = sum([
            (task.completed_at - task.created_at).total_seconds()
            for task in completed_tasks_with_duration
        ])
        
        average_duration = (
            total_duration / len(completed_tasks_with_duration)
            if completed_tasks_with_duration else 0
        )
        
        analytics_data.append(TaskAnalytics(
            task_type=task_type,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            failed_tasks=failed_tasks,
            success_rate=success_rate,
            average_duration=average_duration
        ))
    
    return analytics_data

@router.get("/usage/daily", response_model=List[UsageMetrics])
async def get_daily_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    days: int = 30
):
    """Get daily usage metrics for the last N days."""
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    usage_data = []
    
    for i in range(days):
        current_date = start_date + timedelta(days=i)
        next_date = current_date + timedelta(days=1)
        
        # Get tasks for this day
        total_tasks = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.created_at >= current_date,
            Task.created_at < next_date
        ).count()
        
        completed_tasks = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.created_at >= current_date,
            Task.created_at < next_date,
            Task.status == "completed"
        ).count()
        
        # Get messages for this day
        total_messages = db.query(ChatMessage).join(
            ChatMessage.session
        ).filter(
            ChatMessage.session.has(user_id=current_user.id),
            ChatMessage.created_at >= current_date,
            ChatMessage.created_at < next_date
        ).count()
        
        # Get active agents for this day (agents that had tasks)
        active_agents = db.query(Agent.id).filter(
            Agent.owner_id == current_user.id,
            Agent.tasks.any(
                Task.created_at >= current_date,
                Task.created_at < next_date
            )
        ).distinct().count()
        
        usage_data.append(UsageMetrics(
            date=current_date.strftime('%Y-%m-%d'),
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            total_messages=total_messages,
            active_agents=active_agents
        ))
    
    return usage_data

@router.get("/system/metrics", response_model=SystemMetrics)
async def get_system_metrics(
    current_user: User = Depends(get_current_user)
):
    """Get system performance metrics."""
    
    # In a real implementation, you would get these from system monitoring
    # For now, we'll return mock data
    return SystemMetrics(
        cpu_usage=45.2,
        memory_usage=67.8,
        disk_usage=23.1,
        active_connections=15,
        uptime=86400  # 24 hours in seconds
    )

@router.get("/export")
async def export_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    format: str = "json"
):
    """Export analytics data."""
    
    if format not in ["json", "csv"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format must be 'json' or 'csv'"
        )
    
    # Get all analytics data
    overview = await get_analytics_overview(current_user, db)
    agent_performance = await get_agent_performance(current_user, db)
    task_analytics = await get_task_analytics(current_user, db)
    usage_metrics = await get_daily_usage(current_user, db, 30)
    
    export_data = {
        "overview": overview.dict(),
        "agent_performance": [ap.dict() for ap in agent_performance],
        "task_analytics": [ta.dict() for ta in task_analytics],
        "usage_metrics": [um.dict() for um in usage_metrics],
        "exported_at": datetime.now().isoformat()
    }
    
    if format == "json":
        return export_data
    else:
        # For CSV format, you would implement CSV serialization
        # This is a placeholder
        return {"message": "CSV export not implemented yet"}

@router.post("/metrics/record")
async def record_custom_metric(
    metric_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record a custom metric."""
    
    # Validate required fields
    if not all(key in metric_data for key in ["agent_id", "metric_type", "metric_value"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required fields: agent_id, metric_type, metric_value"
        )
    
    # Verify agent belongs to user
    agent = db.query(Agent).filter(
        Agent.id == metric_data["agent_id"],
        Agent.owner_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    # Record metric
    metric = AgentMetrics(
        agent_id=metric_data["agent_id"],
        metric_type=metric_data["metric_type"],
        metric_value=float(metric_data["metric_value"]),
        metadata=metric_data.get("metadata")
    )
    
    db.add(metric)
    db.commit()
    
    return {"message": "Metric recorded successfully"}
