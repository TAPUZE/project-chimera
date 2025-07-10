from typing import Dict, List, Optional, Any
import asyncio
import logging
from datetime import datetime

from app.core.database import Task, Agent
from app.services.ai_client import AIClient
from app.services.agent_manager import AgentManager

logger = logging.getLogger(__name__)

class TaskManager:
    """Manages task execution and lifecycle."""
    
    def __init__(self):
        self.running_tasks: Dict[int, asyncio.Task] = {}
        self.task_queue: List[Task] = []
        self.ai_client = AIClient()
        self.agent_manager = None
    
    async def initialize(self):
        """Initialize the task manager."""
        logger.info("Initializing Task Manager...")
        await self.ai_client.initialize()
        logger.info("Task Manager initialized successfully")
    
    async def cleanup(self):
        """Clean up resources."""
        logger.info("Cleaning up Task Manager...")
        # Cancel all running tasks
        for task_id, task_future in self.running_tasks.items():
            task_future.cancel()
        self.running_tasks.clear()
        logger.info("Task Manager cleanup complete")
    
    async def execute_task(self, task: Task, parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute a task."""
        start_time = datetime.now()
        
        try:
            logger.info(f"Executing task: {task.title} (ID: {task.id})")
            
            # Decompose task if needed
            if self._should_decompose_task(task):
                return await self._execute_decomposed_task(task, parameters)
            
            # Execute single task
            if task.agent_id:
                # Execute with specific agent
                return await self._execute_with_agent(task, parameters)
            else:
                # Execute without agent (direct AI call)
                return await self._execute_direct(task, parameters)
            
        except Exception as e:
            logger.error(f"Error executing task {task.id}: {str(e)}")
            execution_time = (datetime.now() - start_time).total_seconds()
            
            return {
                "success": False,
                "error": str(e),
                "execution_time": execution_time,
                "task_id": task.id
            }
    
    def _should_decompose_task(self, task: Task) -> bool:
        """Determine if a task should be decomposed into subtasks."""
        # Check if task is complex enough to warrant decomposition
        if task.input_data and isinstance(task.input_data, dict):
            complexity_indicators = [
                "steps" in task.input_data,
                "phases" in task.input_data,
                "multiple_outputs" in task.input_data,
                len(str(task.description)) > 1000
            ]
            return any(complexity_indicators)
        return False
    
    async def _execute_decomposed_task(self, task: Task, parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute a task by decomposing it into subtasks."""
        logger.info(f"Decomposing task: {task.title}")
        
        # Generate subtasks
        subtasks = await self._generate_subtasks(task)
        
        # Execute subtasks
        subtask_results = []
        for subtask in subtasks:
            result = await self.execute_task(subtask, parameters)
            subtask_results.append(result)
        
        # Aggregate results
        aggregated_result = await self._aggregate_results(task, subtask_results)
        
        return aggregated_result
    
    async def _generate_subtasks(self, task: Task) -> List[Task]:
        """Generate subtasks for a complex task."""
        prompt = f"""
        You are a task decomposition expert. Break down the following complex task into smaller, manageable subtasks.
        
        Main Task: {task.title}
        Description: {task.description}
        Input Data: {task.input_data}
        
        Please provide a list of subtasks that:
        1. Are specific and actionable
        2. Can be executed independently
        3. Together accomplish the main task
        4. Are ordered logically
        
        Format as a JSON array of subtask objects with title, description, and task_type.
        """
        
        response = await self.ai_client.generate_completion(
            prompt=prompt,
            model="gpt-4",
            temperature=0.3,
            max_tokens=1000
        )
        
        # Parse response and create subtask objects
        # In a real implementation, you'd parse the JSON response
        # For now, return a simple subtask
        subtasks = [
            Task(
                title=f"Subtask of {task.title}",
                description=f"Auto-generated subtask for {task.title}",
                task_type=task.task_type,
                priority=task.priority,
                user_id=task.user_id,
                parent_task_id=task.id
            )
        ]
        
        return subtasks
    
    async def _aggregate_results(self, main_task: Task, subtask_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Aggregate results from subtasks."""
        successful_results = [r for r in subtask_results if r.get("success")]
        failed_results = [r for r in subtask_results if not r.get("success")]
        
        if not successful_results:
            return {
                "success": False,
                "error": "All subtasks failed",
                "subtask_results": subtask_results,
                "task_id": main_task.id
            }
        
        # Combine successful results
        combined_output = {
            "subtask_count": len(subtask_results),
            "successful_count": len(successful_results),
            "failed_count": len(failed_results),
            "results": successful_results
        }
        
        return {
            "success": True,
            "output_data": combined_output,
            "execution_time": sum(r.get("execution_time", 0) for r in subtask_results),
            "task_id": main_task.id
        }
    
    async def _execute_with_agent(self, task: Task, parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute a task with a specific agent."""
        if not self.agent_manager:
            raise RuntimeError("Agent manager not available")
        
        # Get agent instance
        agent_instance = await self.agent_manager.get_agent_instance(task.agent_id)
        
        if not agent_instance:
            # Agent not running, need to start it
            # This would require database access to get agent details
            raise RuntimeError(f"Agent {task.agent_id} not available")
        
        # Execute task with agent
        result = await agent_instance.execute_task(task)
        
        return result
    
    async def _execute_direct(self, task: Task, parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute a task directly without an agent."""
        start_time = datetime.now()
        
        # Prepare prompt based on task type
        prompt = self._prepare_task_prompt(task, parameters)
        
        # Execute with AI client
        response = await self.ai_client.generate_completion(
            prompt=prompt,
            model="gpt-4",
            temperature=0.7,
            max_tokens=2000
        )
        
        execution_time = (datetime.now() - start_time).total_seconds()
        
        return {
            "success": True,
            "output_data": {
                "type": "direct_execution",
                "content": response,
                "task_type": task.task_type
            },
            "execution_time": execution_time,
            "task_id": task.id
        }
    
    def _prepare_task_prompt(self, task: Task, parameters: Optional[Dict[str, Any]] = None) -> str:
        """Prepare a prompt for direct task execution."""
        base_prompt = f"""
        Task: {task.title}
        Description: {task.description}
        Type: {task.task_type}
        Priority: {task.priority}
        """
        
        if task.input_data:
            base_prompt += f"\nInput Data: {task.input_data}"
        
        if parameters:
            base_prompt += f"\nParameters: {parameters}"
        
        # Add task-specific instructions
        if task.task_type == "research":
            base_prompt += "\n\nPlease conduct thorough research and provide detailed findings with sources."
        elif task.task_type == "analysis":
            base_prompt += "\n\nPlease analyze the data and provide insights, patterns, and recommendations."
        elif task.task_type == "generation":
            base_prompt += "\n\nPlease generate high-quality content that meets the requirements."
        elif task.task_type == "classification":
            base_prompt += "\n\nPlease classify the items according to the specified criteria."
        elif task.task_type == "summary":
            base_prompt += "\n\nPlease provide a comprehensive summary of the content."
        else:
            base_prompt += "\n\nPlease complete the task according to the requirements."
        
        return base_prompt
    
    async def queue_task(self, task: Task) -> None:
        """Add a task to the execution queue."""
        self.task_queue.append(task)
        logger.info(f"Task queued: {task.title} (ID: {task.id})")
    
    async def process_queue(self) -> None:
        """Process tasks in the queue."""
        while self.task_queue:
            task = self.task_queue.pop(0)
            
            # Execute task asynchronously
            task_future = asyncio.create_task(self.execute_task(task))
            self.running_tasks[task.id] = task_future
            
            # Clean up completed tasks
            await self._cleanup_completed_tasks()
    
    async def _cleanup_completed_tasks(self) -> None:
        """Clean up completed tasks."""
        completed_tasks = [
            task_id for task_id, task_future in self.running_tasks.items()
            if task_future.done()
        ]
        
        for task_id in completed_tasks:
            del self.running_tasks[task_id]
    
    async def cancel_task(self, task_id: int) -> bool:
        """Cancel a running task."""
        if task_id in self.running_tasks:
            task_future = self.running_tasks[task_id]
            task_future.cancel()
            del self.running_tasks[task_id]
            logger.info(f"Task cancelled: {task_id}")
            return True
        return False
    
    def get_running_tasks(self) -> List[int]:
        """Get list of currently running task IDs."""
        return list(self.running_tasks.keys())
    
    def get_queue_size(self) -> int:
        """Get the number of tasks in the queue."""
        return len(self.task_queue)
