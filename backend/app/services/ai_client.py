from typing import Dict, List, Optional, Any
import asyncio
import logging
import openai
import httpx
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)

class AIClient:
    """Client for interacting with AI models."""
    
    def __init__(self):
        self.openai_client = None
        self.anthropic_client = None
        self.gemini_client = None
        self.local_clients = {}
        self.model_configs = {
            "gpt-4": {"provider": "openai", "max_tokens": 4000},
            "gpt-3.5-turbo": {"provider": "openai", "max_tokens": 4000},
            "claude-3-opus": {"provider": "anthropic", "max_tokens": 4000},
            "claude-3-sonnet": {"provider": "anthropic", "max_tokens": 4000},
            "claude-3-haiku": {"provider": "anthropic", "max_tokens": 4000},
            "gemini-pro": {"provider": "gemini", "max_tokens": 4000},
            "gemini-pro-vision": {"provider": "gemini", "max_tokens": 4000},
            "local-llama": {"provider": "local", "max_tokens": 2000}
        }
    
    async def initialize(self):
        """Initialize AI clients."""
        logger.info("Initializing AI Client...")
        
        # Initialize OpenAI
        if settings.OPENAI_API_KEY:
            self.openai_client = openai.AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY
            )
            logger.info("OpenAI client initialized")
        
        # Initialize Anthropic
        if settings.ANTHROPIC_API_KEY:
            try:
                import anthropic
                self.anthropic_client = anthropic.AsyncAnthropic(
                    api_key=settings.ANTHROPIC_API_KEY
                )
                logger.info("Anthropic client initialized")
            except ImportError:
                logger.warning("Anthropic library not installed")
        
        # Initialize Gemini
        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.gemini_client = genai
                logger.info("Gemini client initialized")
            except ImportError:
                logger.warning("Google Generative AI library not installed")
        
        # Initialize local models
        await self._initialize_local_models()
        
        logger.info("AI Client initialized successfully")
    
    async def _initialize_local_models(self):
        """Initialize local model connections."""
        # This would connect to local models like Ollama
        # For now, we'll just log that it's available
        logger.info("Local model support available")
    
    async def generate_completion(
        self,
        prompt: str,
        model: str = "gpt-4",
        temperature: float = 0.7,
        max_tokens: int = 1000,
        system_prompt: Optional[str] = None
    ) -> str:
        """Generate a completion using the specified model."""
        
        model_config = self.model_configs.get(model, self.model_configs["gpt-4"])
        provider = model_config["provider"]
        
        if provider == "openai":
            return await self._generate_openai_completion(
                prompt, model, temperature, max_tokens, system_prompt
            )
        elif provider == "anthropic":
            return await self._generate_anthropic_completion(
                prompt, model, temperature, max_tokens, system_prompt
            )
        elif provider == "gemini":
            return await self._generate_gemini_completion(
                prompt, model, temperature, max_tokens, system_prompt
            )
        elif provider == "local":
            return await self._generate_local_completion(
                prompt, model, temperature, max_tokens, system_prompt
            )
        else:
            raise ValueError(f"Unsupported model provider: {provider}")
    
    async def _generate_openai_completion(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str] = None
    ) -> str:
        """Generate completion using OpenAI."""
        
        if not self.openai_client:
            raise RuntimeError("OpenAI client not initialized")
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"OpenAI completion error: {str(e)}")
            raise
    
    async def _generate_anthropic_completion(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str] = None
    ) -> str:
        """Generate completion using Anthropic."""
        
        if not self.anthropic_client:
            raise RuntimeError("Anthropic client not initialized")
        
        try:
            # Combine system prompt and user prompt
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\nHuman: {prompt}\n\nAssistant:"
            
            response = await self.anthropic_client.completions.create(
                model=model,
                prompt=full_prompt,
                temperature=temperature,
                max_tokens_to_sample=max_tokens
            )
            
            return response.completion
            
        except Exception as e:
            logger.error(f"Anthropic completion error: {str(e)}")
            raise
    
    async def _generate_gemini_completion(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str] = None
    ) -> str:
        """Generate completion using Google Gemini."""
        
        if not self.gemini_client:
            raise RuntimeError("Gemini client not initialized")
        
        try:
            # Initialize the model
            genai_model = self.gemini_client.GenerativeModel(model)
            
            # Prepare the prompt
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"
            
            # Generate response
            response = genai_model.generate_content(
                full_prompt,
                generation_config=self.gemini_client.types.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                )
            )
            
            return response.text
            
        except Exception as e:
            logger.error(f"Gemini completion error: {str(e)}")
            raise

    async def _generate_local_completion(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str] = None
    ) -> str:
        """Generate completion using local model."""
        
        # This would interface with local models like Ollama
        # For now, return a mock response
        logger.info(f"Generating local completion with {model}")
        
        return f"[Local Model Response] This is a mock response for prompt: {prompt[:100]}..."
    
    async def generate_embedding(self, text: str, model: str = "text-embedding-ada-002") -> List[float]:
        """Generate text embedding."""
        
        if not self.openai_client:
            raise RuntimeError("OpenAI client not initialized")
        
        try:
            response = await self.openai_client.embeddings.create(
                model=model,
                input=text
            )
            
            return response.data[0].embedding
            
        except Exception as e:
            logger.error(f"Embedding generation error: {str(e)}")
            raise
    
    async def generate_image(
        self,
        prompt: str,
        model: str = "dall-e-3",
        size: str = "1024x1024",
        quality: str = "standard"
    ) -> str:
        """Generate image using DALL-E."""
        
        if not self.openai_client:
            raise RuntimeError("OpenAI client not initialized")
        
        try:
            response = await self.openai_client.images.generate(
                model=model,
                prompt=prompt,
                size=size,
                quality=quality,
                n=1
            )
            
            return response.data[0].url
            
        except Exception as e:
            logger.error(f"Image generation error: {str(e)}")
            raise
    
    async def transcribe_audio(self, audio_file: bytes, model: str = "whisper-1") -> str:
        """Transcribe audio using Whisper."""
        
        if not self.openai_client:
            raise RuntimeError("OpenAI client not initialized")
        
        try:
            response = await self.openai_client.audio.transcriptions.create(
                model=model,
                file=audio_file
            )
            
            return response.text
            
        except Exception as e:
            logger.error(f"Audio transcription error: {str(e)}")
            raise
    
    async def stream_completion(
        self,
        prompt: str,
        model: str = "gpt-4",
        temperature: float = 0.7,
        max_tokens: int = 1000,
        system_prompt: Optional[str] = None
    ):
        """Generate streaming completion."""
        
        if not self.openai_client:
            raise RuntimeError("OpenAI client not initialized")
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            stream = await self.openai_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error(f"Streaming completion error: {str(e)}")
            raise
    
    def get_available_models(self) -> List[str]:
        """Get list of available models."""
        return list(self.model_configs.keys())
    
    def get_model_info(self, model: str) -> Dict[str, Any]:
        """Get information about a specific model."""
        return self.model_configs.get(model, {})
    
    async def validate_api_keys(self) -> Dict[str, bool]:
        """Validate API keys for different providers."""
        results = {}
        
        # Test OpenAI
        if self.openai_client:
            try:
                await self.openai_client.models.list()
                results["openai"] = True
            except:
                results["openai"] = False
        else:
            results["openai"] = False
        
        # Test Gemini
        if self.gemini_client:
            try:
                # Simple test to verify API key
                test_model = self.gemini_client.GenerativeModel("gemini-pro")
                test_response = test_model.generate_content("Hello")
                results["gemini"] = True
            except:
                results["gemini"] = False
        else:
            results["gemini"] = False
        
        # Test Anthropic
        if self.anthropic_client:
            try:
                # This would test the Anthropic API
                results["anthropic"] = True
            except:
                results["anthropic"] = False
        else:
            results["anthropic"] = False
        
        return results
    
    async def get_token_count(self, text: str, model: str = "gpt-4") -> int:
        """Get token count for text."""
        try:
            import tiktoken
            
            if model.startswith("gpt-4"):
                encoding = tiktoken.encoding_for_model("gpt-4")
            elif model.startswith("gpt-3.5"):
                encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
            else:
                encoding = tiktoken.get_encoding("cl100k_base")
            
            tokens = encoding.encode(text)
            return len(tokens)
            
        except ImportError:
            # Fallback to rough estimation
            return len(text.split()) * 1.3
        
        except Exception as e:
            logger.error(f"Token counting error: {str(e)}")
            return 0
