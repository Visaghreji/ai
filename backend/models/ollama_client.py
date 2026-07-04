import os
import httpx
import json
import logging
from typing import AsyncGenerator, List, Dict

logger = logging.getLogger("lex-backend")

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

async def check_ollama_status() -> Dict:
    """Checks the status of the local Ollama instance and lists installed models."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(f"{OLLAMA_HOST}/api/tags")
            if response.status_code == 200:
                data = response.json()
                models = [m["name"] for m in data.get("models", [])]
                has_lex = "lex:latest" in models or "lex" in models
                return {
                    "online": True,
                    "models": models,
                    "has_lex_model": has_lex,
                    "message": "Ollama is running."
                }
            else:
                return {
                    "online": False,
                    "models": [],
                    "has_lex_model": False,
                    "message": f"Ollama returned status code {response.status_code}."
                }
    except Exception as e:
        return {
            "online": False,
            "models": [],
            "has_lex_model": False,
            "message": f"Could not connect to Ollama. Ensure Ollama is running. Error: {str(e)}"
        }

async def stream_ollama_chat(messages: List[Dict[str, str]], model: str = "lex") -> AsyncGenerator[str, None]:
    """Streams responses from local Ollama chat API."""
    url = f"{OLLAMA_HOST}/api/chat"
    payload = {
        "model": model,
        "messages": messages,
        "stream": True,
        "options": {
            "temperature": 0.0
        }
    }
    
    try:
        timeout = httpx.Timeout(120.0, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            async with client.stream("POST", url, json=payload) as response:
                if response.status_code != 200:
                    yield f"[Error: Ollama returned status {response.status_code}]"
                    return
                
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    try:
                        chunk = json.loads(line)
                        content = chunk.get("message", {}).get("content", "")
                        if content:
                            yield content
                    except json.JSONDecodeError:
                        continue
    except Exception as e:
        logger.error(f"Error streaming from Ollama: {e}")
        err_msg = str(e) or type(e).__name__
        yield f"[Error: Failed to connect to Ollama: {err_msg}. Make sure Ollama is running and model '{model}' is installed.]"
