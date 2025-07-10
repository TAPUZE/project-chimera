from typing import Dict, List, Optional, Any
import asyncio
import json
import logging
from datetime import datetime

from app.core.database import Agent, ChatSession
from app.services.ai_client import AIClient

logger = logging.getLogger(__name__)

class ChatManager:
    """Manages chat sessions and conversations."""
    
    def __init__(self):
        self.ai_client = AIClient()
        self.active_sessions: Dict[int, ChatContext] = {}
    
    async def initialize(self):
        """Initialize the chat manager."""
        logger.info("Initializing Chat Manager...")
        await self.ai_client.initialize()
        logger.info("Chat Manager initialized successfully")
    
    async def generate_response(
        self,
        message: str,
        agent: Optional[Agent] = None,
        session_id: Optional[int] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """Generate a response to a chat message."""
        
        # Get or create chat context
        context = await self._get_or_create_context(session_id, agent)
        
        # Add user message to context
        context.add_message("user", message)
        
        # Generate response
        if agent:
            response = await self._generate_agent_response(
                context, agent, temperature, max_tokens
            )
        else:
            response = await self._generate_default_response(
                context, temperature, max_tokens
            )
        
        # Add assistant response to context
        context.add_message("assistant", response)
        
        return {
            "content": response,
            "metadata": {
                "model": agent.model if agent else "gpt-4",
                "temperature": temperature,
                "max_tokens": max_tokens,
                "context_length": len(context.messages)
            }
        }
    
    async def _get_or_create_context(self, session_id: Optional[int], agent: Optional[Agent]) -> "ChatContext":
        """Get or create a chat context."""
        if session_id and session_id in self.active_sessions:
            return self.active_sessions[session_id]
        
        context = ChatContext(session_id, agent)
        if session_id:
            self.active_sessions[session_id] = context
        
        return context
    
    async def _generate_agent_response(
        self,
        context: "ChatContext",
        agent: Agent,
        temperature: float,
        max_tokens: int
    ) -> str:
        """Generate response using a specific agent."""
        
        # Prepare system prompt
        system_prompt = self._prepare_agent_system_prompt(agent, context)
        
        # Prepare conversation history
        conversation_prompt = self._prepare_conversation_prompt(context)
        
        # Generate response
        response = await self.ai_client.generate_completion(
            prompt=conversation_prompt,
            model=agent.model,
            temperature=temperature,
            max_tokens=max_tokens,
            system_prompt=system_prompt
        )
        
        return response
    
    async def _generate_default_response(
        self,
        context: "ChatContext",
        temperature: float,
        max_tokens: int
    ) -> str:
        """Generate response using default model."""
        
        system_prompt = """You are a helpful AI assistant. You are part of Project Chimera, 
        a multi-agent AI system. Provide helpful, accurate, and engaging responses."""
        
        conversation_prompt = self._prepare_conversation_prompt(context)
        
        response = await self.ai_client.generate_completion(
            prompt=conversation_prompt,
            model="gpt-4",
            temperature=temperature,
            max_tokens=max_tokens,
            system_prompt=system_prompt
        )
        
        return response
    
    def _prepare_agent_system_prompt(self, agent: Agent, context: "ChatContext") -> str:
        """Prepare system prompt for an agent."""
        
        base_prompt = f"""You are {agent.name}, a {agent.agent_type} agent in Project Chimera.
        
        Agent Description: {agent.description or 'No description provided'}
        
        Your capabilities include: {', '.join(agent.capabilities) if agent.capabilities else 'General assistance'}
        
        """
        
        if agent.system_prompt:
            base_prompt += f"\nAdditional Instructions: {agent.system_prompt}"
        
        # Add context-specific instructions
        if agent.agent_type == "researcher":
            base_prompt += "\nFocus on providing well-researched, factual information with sources when possible."
        elif agent.agent_type == "analyst":
            base_prompt += "\nProvide analytical insights, identify patterns, and offer data-driven recommendations."
        elif agent.agent_type == "creative":
            base_prompt += "\nBe creative and innovative in your responses. Think outside the box."
        elif agent.agent_type == "assistant":
            base_prompt += "\nBe helpful, clear, and comprehensive in your assistance."
        
        return base_prompt
    
    def _prepare_conversation_prompt(self, context: "ChatContext") -> str:
        """Prepare conversation prompt from context."""
        
        if not context.messages:
            return "Hello! How can I help you today?"
        
        # Get recent messages (last 10 to manage context length)
        recent_messages = context.messages[-10:]
        
        conversation_lines = []
        for msg in recent_messages:
            role = "Human" if msg["role"] == "user" else "Assistant"
            conversation_lines.append(f"{role}: {msg['content']}")
        
        # Add the latest user message
        latest_message = recent_messages[-1]
        if latest_message["role"] == "user":
            return "\n".join(conversation_lines)
        else:
            return "\n".join(conversation_lines) + "\n\nHuman: "
    
    async def stream_response(
        self,
        message: str,
        agent: Optional[Agent] = None,
        session_id: Optional[int] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ):
        """Generate a streaming response."""
        
        context = await self._get_or_create_context(session_id, agent)
        context.add_message("user", message)
        
        # Prepare prompts
        if agent:
            system_prompt = self._prepare_agent_system_prompt(agent, context)
            model = agent.model
        else:
            system_prompt = """You are a helpful AI assistant. You are part of Project Chimera, 
            a multi-agent AI system. Provide helpful, accurate, and engaging responses."""
            model = "gpt-4"
        
        conversation_prompt = self._prepare_conversation_prompt(context)
        
        # Stream response
        full_response = ""
        async for chunk in self.ai_client.stream_completion(
            prompt=conversation_prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            system_prompt=system_prompt
        ):
            full_response += chunk
            yield chunk
        
        # Add complete response to context
        context.add_message("assistant", full_response)
    
    async def get_conversation_summary(self, session_id: int) -> str:
        """Get a summary of a conversation."""
        
        if session_id not in self.active_sessions:
            return "No active conversation found."
        
        context = self.active_sessions[session_id]
        
        if not context.messages:
            return "No messages in conversation."
        
        # Prepare conversation for summarization
        conversation_text = "\n".join([
            f"{msg['role']}: {msg['content']}"
            for msg in context.messages
        ])
        
        summary_prompt = f"""Please provide a concise summary of this conversation:

{conversation_text}

Summary:"""
        
        summary = await self.ai_client.generate_completion(
            prompt=summary_prompt,
            model="gpt-4",
            temperature=0.3,
            max_tokens=200
        )
        
        return summary
    
    async def get_suggested_replies(self, session_id: int) -> List[str]:
        """Get suggested replies for a conversation."""
        
        if session_id not in self.active_sessions:
            return []
        
        context = self.active_sessions[session_id]
        
        if not context.messages:
            return ["Hello! How can I help you today?"]
        
        # Get last few messages
        recent_messages = context.messages[-3:]
        conversation_text = "\n".join([
            f"{msg['role']}: {msg['content']}"
            for msg in recent_messages
        ])
        
        suggestions_prompt = f"""Based on this conversation, suggest 3 helpful follow-up questions or responses:

{conversation_text}

Please provide 3 short, relevant suggestions:"""
        
        suggestions = await self.ai_client.generate_completion(
            prompt=suggestions_prompt,
            model="gpt-3.5-turbo",
            temperature=0.5,
            max_tokens=150
        )
        
        # Parse suggestions (simple implementation)
        suggestion_lines = [line.strip() for line in suggestions.split('\n') if line.strip()]
        return suggestion_lines[:3]
    
    def clear_session(self, session_id: int):
        """Clear a chat session from active sessions."""
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
    
    def get_active_sessions(self) -> List[int]:
        """Get list of active session IDs."""
        return list(self.active_sessions.keys())


class ChatContext:
    """Represents the context of a chat session."""
    
    def __init__(self, session_id: Optional[int], agent: Optional[Agent]):
        self.session_id = session_id
        self.agent = agent
        self.messages: List[Dict[str, Any]] = []
        self.created_at = datetime.now()
        self.last_activity = datetime.now()
    
    def add_message(self, role: str, content: str, metadata: Optional[Dict[str, Any]] = None):
        """Add a message to the context."""
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        self.messages.append(message)
        self.last_activity = datetime.now()
    
    def get_message_count(self) -> int:
        """Get total number of messages."""
        return len(self.messages)
    
    def get_last_message(self) -> Optional[Dict[str, Any]]:
        """Get the last message."""
        return self.messages[-1] if self.messages else None
    
    def clear_messages(self):
        """Clear all messages."""
        self.messages.clear()
        self.last_activity = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert context to dictionary."""
        return {
            "session_id": self.session_id,
            "agent_id": self.agent.id if self.agent else None,
            "agent_name": self.agent.name if self.agent else None,
            "message_count": len(self.messages),
            "created_at": self.created_at.isoformat(),
            "last_activity": self.last_activity.isoformat(),
            "messages": self.messages
        }
