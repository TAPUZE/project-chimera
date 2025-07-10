from typing import Dict, List, Optional, Any
import asyncio
import logging
from datetime import datetime

from app.core.database import Agent, Task
from app.services.ai_client import AIClient
from app.services.websocket_manager import WebSocketManager

logger = logging.getLogger(__name__)

class AgentManager:
    """Manages AI agents and their lifecycle."""
    
    def __init__(self):
        self.agents: Dict[int, "AgentInstance"] = {}
        self.ai_client = AIClient()
        self.websocket_manager = None
    
    async def initialize(self):
        """Initialize the agent manager."""
        logger.info("Initializing Agent Manager...")
        await self.ai_client.initialize()
        logger.info("Agent Manager initialized successfully")
    
    async def cleanup(self):
        """Clean up resources."""
        logger.info("Cleaning up Agent Manager...")
        # Stop all running agents
        for agent_id, agent_instance in self.agents.items():
            await agent_instance.stop()
        self.agents.clear()
        logger.info("Agent Manager cleanup complete")
    
    async def create_agent_instance(self, agent: Agent) -> "AgentInstance":
        """Create a new agent instance."""
        agent_instance = AgentInstance(agent, self.ai_client)
        await agent_instance.initialize()
        self.agents[agent.id] = agent_instance
        
        logger.info(f"Created agent instance: {agent.name} (ID: {agent.id})")
        return agent_instance
    
    async def get_agent_instance(self, agent_id: int) -> Optional["AgentInstance"]:
        """Get an agent instance by ID."""
        return self.agents.get(agent_id)
    
    async def remove_agent_instance(self, agent_id: int):
        """Remove an agent instance."""
        if agent_id in self.agents:
            agent_instance = self.agents[agent_id]
            await agent_instance.stop()
            del self.agents[agent_id]
            logger.info(f"Removed agent instance: {agent_id}")
    
    async def execute_task(self, agent: Agent, task: Task) -> Dict[str, Any]:
        """Execute a task using an agent."""
        # Get or create agent instance
        agent_instance = await self.get_agent_instance(agent.id)
        if not agent_instance:
            agent_instance = await self.create_agent_instance(agent)
        
        # Execute task
        result = await agent_instance.execute_task(task)
        
        # Notify via WebSocket if available
        if self.websocket_manager:
            await self.websocket_manager.broadcast_task_update(task.id, result)
        
        return result


class AgentInstance:
    """Represents a running instance of an AI agent."""
    
    def __init__(self, agent: Agent, ai_client: AIClient):
        self.agent = agent
        self.ai_client = ai_client
        self.is_running = False
        self.current_task = None
        self.context = {}
        self.memory = []
        self.capabilities = agent.capabilities or {}
        
    async def initialize(self):
        """Initialize the agent instance."""
        self.is_running = True
        logger.info(f"Agent {self.agent.name} initialized")
    
    async def stop(self):
        """Stop the agent instance."""
        self.is_running = False
        if self.current_task:
            # Handle task cancellation
            logger.info(f"Stopping agent {self.agent.name} with active task")
        logger.info(f"Agent {self.agent.name} stopped")
    
    async def execute_task(self, task: Task) -> Dict[str, Any]:
        """Execute a task."""
        if not self.is_running:
            raise RuntimeError(f"Agent {self.agent.name} is not running")
        
        self.current_task = task
        start_time = datetime.now()
        
        try:
            logger.info(f"Agent {self.agent.name} executing task: {task.title}")
            
            # Prepare context
            context = {
                "agent_name": self.agent.name,
                "agent_type": self.agent.agent_type,
                "task_type": task.task_type,
                "task_title": task.title,
                "task_description": task.description,
                "input_data": task.input_data,
                "system_prompt": self.agent.system_prompt,
                "memory": self.memory[-10:] if self.memory else []  # Last 10 memories
            }
            
            # Execute based on task type
            if task.task_type == "research":
                result = await self._execute_research_task(task, context)
            elif task.task_type == "analysis":
                result = await self._execute_analysis_task(task, context)
            elif task.task_type == "generation":
                result = await self._execute_generation_task(task, context)
            elif task.task_type == "classification":
                result = await self._execute_classification_task(task, context)
            elif task.task_type == "summary":
                result = await self._execute_summary_task(task, context)
            else:
                result = await self._execute_custom_task(task, context)
            
            # Add to memory
            self.memory.append({
                "task_id": task.id,
                "task_type": task.task_type,
                "input": task.input_data,
                "output": result,
                "timestamp": datetime.now().isoformat()
            })
            
            # Limit memory size
            if len(self.memory) > 100:
                self.memory = self.memory[-100:]
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            return {
                "success": True,
                "output_data": result,
                "execution_time": execution_time,
                "agent_id": self.agent.id,
                "agent_name": self.agent.name
            }
            
        except Exception as e:
            logger.error(f"Error executing task: {str(e)}")
            execution_time = (datetime.now() - start_time).total_seconds()
            
            return {
                "success": False,
                "error": str(e),
                "execution_time": execution_time,
                "agent_id": self.agent.id,
                "agent_name": self.agent.name
            }
        
        finally:
            self.current_task = None
    
    async def _execute_research_task(self, task: Task, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a research task."""
        prompt = f"""
        You are a research agent named {self.agent.name}.
        
        Task: {task.title}
        Description: {task.description}
        Input Data: {task.input_data}
        
        Please conduct thorough research on the given topic and provide:
        1. Key findings
        2. Sources and references
        3. Summary of insights
        4. Recommendations for further research
        
        Format your response as structured data.
        """
        
        response = await self.ai_client.generate_completion(
            prompt=prompt,
            model=self.agent.model,
            temperature=self.agent.temperature,
            max_tokens=self.agent.max_tokens
        )
        
        return {
            "type": "research_results",
            "content": response,
            "methodology": "AI-powered research",
            "sources": [],
            "confidence": 0.8
        }
    
    async def _execute_analysis_task(self, task: Task, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute an analysis task."""
        prompt = f"""
        You are a data analyst agent named {self.agent.name}.
        
        Task: {task.title}
        Description: {task.description}
        Data to analyze: {task.input_data}
        
        Please analyze the provided data and provide:
        1. Key patterns and trends
        2. Statistical insights
        3. Anomalies or outliers
        4. Conclusions and recommendations
        
        Format your response as structured analysis results.
        """
        
        response = await self.ai_client.generate_completion(
            prompt=prompt,
            model=self.agent.model,
            temperature=self.agent.temperature,
            max_tokens=self.agent.max_tokens
        )
        
        return {
            "type": "analysis_results",
            "content": response,
            "data_points": 0,
            "confidence": 0.85,
            "visualizations": []
        }
    
    async def _execute_generation_task(self, task: Task, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a generation task."""
        prompt = f"""
        You are a creative generation agent named {self.agent.name}.
        
        Task: {task.title}
        Description: {task.description}
        Requirements: {task.input_data}
        
        Please generate high-quality content based on the requirements.
        Be creative, original, and ensure the content meets the specified criteria.
        """
        
        response = await self.ai_client.generate_completion(
            prompt=prompt,
            model=self.agent.model,
            temperature=self.agent.temperature,
            max_tokens=self.agent.max_tokens
        )
        
        return {
            "type": "generated_content",
            "content": response,
            "word_count": len(response.split()),
            "creativity_score": 0.9
        }
    
    async def _execute_classification_task(self, task: Task, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a classification task."""
        prompt = f"""
        You are a classification agent named {self.agent.name}.
        
        Task: {task.title}
        Description: {task.description}
        Items to classify: {task.input_data}
        
        Please classify the provided items according to the specified criteria.
        Provide clear categories and confidence scores for each classification.
        """
        
        response = await self.ai_client.generate_completion(
            prompt=prompt,
            model=self.agent.model,
            temperature=self.agent.temperature,
            max_tokens=self.agent.max_tokens
        )
        
        return {
            "type": "classification_results",
            "content": response,
            "categories": [],
            "confidence_scores": [],
            "accuracy": 0.9
        }
    
    async def _execute_summary_task(self, task: Task, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a summary task."""
        prompt = f"""
        You are a summarization agent named {self.agent.name}.
        
        Task: {task.title}
        Description: {task.description}
        Content to summarize: {task.input_data}
        
        Please provide a comprehensive summary that captures the key points,
        main ideas, and important details while being concise and well-structured.
        """
        
        response = await self.ai_client.generate_completion(
            prompt=prompt,
            model=self.agent.model,
            temperature=self.agent.temperature,
            max_tokens=self.agent.max_tokens
        )
        
        return {
            "type": "summary_results",
            "content": response,
            "original_length": len(str(task.input_data)),
            "summary_length": len(response),
            "compression_ratio": 0.3
        }
    
    async def _execute_custom_task(self, task: Task, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a custom task."""
        system_prompt = self.agent.system_prompt or "You are a helpful AI assistant."
        
        prompt = f"""
        {system_prompt}
        
        Task: {task.title}
        Description: {task.description}
        Input: {task.input_data}
        
        Please complete this task according to the requirements.
        """
        
        response = await self.ai_client.generate_completion(
            prompt=prompt,
            model=self.agent.model,
            temperature=self.agent.temperature,
            max_tokens=self.agent.max_tokens
        )
        
        return {
            "type": "custom_results",
            "content": response,
            "task_type": task.task_type,
            "agent_type": self.agent.agent_type
        }
