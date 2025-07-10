from typing import Dict, List, Set, Any, Optional
import asyncio
import json
import logging
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

class WebSocketManager:
    """Manages WebSocket connections for real-time communication."""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.client_sessions: Dict[str, Dict[str, Any]] = {}
        self.subscriptions: Dict[str, Set[str]] = {}  # topic -> set of client_ids
        
    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept a WebSocket connection."""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.client_sessions[client_id] = {
            "connected_at": datetime.now(),
            "last_activity": datetime.now(),
            "subscriptions": set()
        }
        
        logger.info(f"Client connected: {client_id}")
        
        # Send welcome message
        await self.send_personal_message(client_id, {
            "type": "welcome",
            "message": "Connected to Project Chimera",
            "client_id": client_id,
            "timestamp": datetime.now().isoformat()
        })
    
    def disconnect(self, client_id: str):
        """Disconnect a client."""
        if client_id in self.active_connections:
            # Remove from all subscriptions
            for topic in list(self.subscriptions.keys()):
                if client_id in self.subscriptions[topic]:
                    self.subscriptions[topic].discard(client_id)
                    if not self.subscriptions[topic]:
                        del self.subscriptions[topic]
            
            # Clean up client data
            del self.active_connections[client_id]
            if client_id in self.client_sessions:
                del self.client_sessions[client_id]
            
            logger.info(f"Client disconnected: {client_id}")
    
    async def send_personal_message(self, client_id: str, message: Dict[str, Any]):
        """Send a message to a specific client."""
        if client_id in self.active_connections:
            try:
                websocket = self.active_connections[client_id]
                await websocket.send_text(json.dumps(message))
                
                # Update last activity
                if client_id in self.client_sessions:
                    self.client_sessions[client_id]["last_activity"] = datetime.now()
                    
            except Exception as e:
                logger.error(f"Error sending message to {client_id}: {e}")
                # Remove disconnected client
                self.disconnect(client_id)
    
    async def broadcast_message(self, message: Dict[str, Any], exclude_client: Optional[str] = None):
        """Broadcast a message to all connected clients."""
        disconnected_clients = []
        
        for client_id, websocket in self.active_connections.items():
            if client_id != exclude_client:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error broadcasting to {client_id}: {e}")
                    disconnected_clients.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected_clients:
            self.disconnect(client_id)
    
    async def subscribe(self, client_id: str, topic: str):
        """Subscribe a client to a topic."""
        if topic not in self.subscriptions:
            self.subscriptions[topic] = set()
        
        self.subscriptions[topic].add(client_id)
        
        if client_id in self.client_sessions:
            self.client_sessions[client_id]["subscriptions"].add(topic)
        
        logger.info(f"Client {client_id} subscribed to {topic}")
        
        # Send confirmation
        await self.send_personal_message(client_id, {
            "type": "subscription_confirmed",
            "topic": topic,
            "timestamp": datetime.now().isoformat()
        })
    
    async def unsubscribe(self, client_id: str, topic: str):
        """Unsubscribe a client from a topic."""
        if topic in self.subscriptions:
            self.subscriptions[topic].discard(client_id)
            if not self.subscriptions[topic]:
                del self.subscriptions[topic]
        
        if client_id in self.client_sessions:
            self.client_sessions[client_id]["subscriptions"].discard(topic)
        
        logger.info(f"Client {client_id} unsubscribed from {topic}")
    
    async def publish_to_topic(self, topic: str, message: Dict[str, Any]):
        """Publish a message to all subscribers of a topic."""
        if topic not in self.subscriptions:
            return
        
        disconnected_clients = []
        message_with_topic = {**message, "topic": topic}
        
        for client_id in self.subscriptions[topic]:
            if client_id in self.active_connections:
                try:
                    websocket = self.active_connections[client_id]
                    await websocket.send_text(json.dumps(message_with_topic))
                except Exception as e:
                    logger.error(f"Error publishing to {client_id}: {e}")
                    disconnected_clients.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected_clients:
            self.disconnect(client_id)
    
    async def handle_message(self, client_id: str, message: str):
        """Handle incoming message from a client."""
        try:
            data = json.loads(message)
            message_type = data.get("type")
            
            if message_type == "subscribe":
                topic = data.get("topic")
                if topic:
                    await self.subscribe(client_id, topic)
            
            elif message_type == "unsubscribe":
                topic = data.get("topic")
                if topic:
                    await self.unsubscribe(client_id, topic)
            
            elif message_type == "ping":
                await self.send_personal_message(client_id, {
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                })
            
            elif message_type == "chat_message":
                # Handle chat message
                await self.handle_chat_message(client_id, data)
            
            elif message_type == "agent_command":
                # Handle agent command
                await self.handle_agent_command(client_id, data)
            
            elif message_type == "task_command":
                # Handle task command
                await self.handle_task_command(client_id, data)
            
            else:
                logger.warning(f"Unknown message type from {client_id}: {message_type}")
        
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON from {client_id}: {message}")
            await self.send_personal_message(client_id, {
                "type": "error",
                "message": "Invalid JSON format",
                "timestamp": datetime.now().isoformat()
            })
        
        except Exception as e:
            logger.error(f"Error handling message from {client_id}: {e}")
            await self.send_personal_message(client_id, {
                "type": "error",
                "message": "Internal error processing message",
                "timestamp": datetime.now().isoformat()
            })
    
    async def handle_chat_message(self, client_id: str, data: Dict[str, Any]):
        """Handle chat message from client."""
        # This would integrate with the ChatManager
        message = data.get("message", "")
        session_id = data.get("session_id")
        
        # Echo the message back for now
        await self.send_personal_message(client_id, {
            "type": "chat_response",
            "message": f"Received: {message}",
            "session_id": session_id,
            "timestamp": datetime.now().isoformat()
        })
    
    async def handle_agent_command(self, client_id: str, data: Dict[str, Any]):
        """Handle agent command from client."""
        command = data.get("command")
        agent_id = data.get("agent_id")
        
        # Process agent command
        await self.send_personal_message(client_id, {
            "type": "agent_response",
            "command": command,
            "agent_id": agent_id,
            "status": "processed",
            "timestamp": datetime.now().isoformat()
        })
    
    async def handle_task_command(self, client_id: str, data: Dict[str, Any]):
        """Handle task command from client."""
        command = data.get("command")
        task_id = data.get("task_id")
        
        # Process task command
        await self.send_personal_message(client_id, {
            "type": "task_response",
            "command": command,
            "task_id": task_id,
            "status": "processed",
            "timestamp": datetime.now().isoformat()
        })
    
    async def broadcast_agent_update(self, agent_id: int, update_data: Dict[str, Any]):
        """Broadcast agent update to subscribers."""
        await self.publish_to_topic(f"agent_{agent_id}", {
            "type": "agent_update",
            "agent_id": agent_id,
            "data": update_data,
            "timestamp": datetime.now().isoformat()
        })
    
    async def broadcast_task_update(self, task_id: int, update_data: Dict[str, Any]):
        """Broadcast task update to subscribers."""
        await self.publish_to_topic(f"task_{task_id}", {
            "type": "task_update",
            "task_id": task_id,
            "data": update_data,
            "timestamp": datetime.now().isoformat()
        })
    
    async def broadcast_system_notification(self, notification: Dict[str, Any]):
        """Broadcast system notification to all clients."""
        await self.publish_to_topic("system", {
            "type": "system_notification",
            "notification": notification,
            "timestamp": datetime.now().isoformat()
        })
    
    def get_connected_clients(self) -> List[str]:
        """Get list of connected client IDs."""
        return list(self.active_connections.keys())
    
    def get_client_count(self) -> int:
        """Get number of connected clients."""
        return len(self.active_connections)
    
    def get_topic_subscribers(self, topic: str) -> Set[str]:
        """Get subscribers for a topic."""
        return self.subscriptions.get(topic, set())
    
    def get_client_info(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a client."""
        if client_id not in self.client_sessions:
            return None
        
        session = self.client_sessions[client_id]
        return {
            "client_id": client_id,
            "connected_at": session["connected_at"].isoformat(),
            "last_activity": session["last_activity"].isoformat(),
            "subscriptions": list(session["subscriptions"])
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get WebSocket manager statistics."""
        return {
            "connected_clients": len(self.active_connections),
            "total_subscriptions": sum(len(subs) for subs in self.subscriptions.values()),
            "topics": list(self.subscriptions.keys()),
            "uptime": datetime.now().isoformat()
        }
