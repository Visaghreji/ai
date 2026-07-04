import os
import httpx
import json
import logging
from typing import AsyncGenerator, List, Dict

logger = logging.getLogger("lex-backend")

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

async def check_ollama_status() -> Dict:
    """Checks the status of the configured LLM provider."""
    llm_provider = os.getenv("LLM_PROVIDER", "ollama").lower()
    
    if llm_provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY", "")
        model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-3.5-turbo")
        if not api_key:
            return {
                "online": False,
                "models": [],
                "has_lex_model": False,
                "message": "Cloud provider (OpenAI-compatible) selected, but OPENAI_API_KEY is not set."
            }
        return {
            "online": True,
            "models": [model_name],
            "has_lex_model": True,
            "message": f"Cloud provider (OpenAI-compatible) is online. Model: {model_name}"
        }

    # Default to local Ollama check
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
    """Streams responses from the configured LLM provider."""
    llm_provider = os.getenv("LLM_PROVIDER", "ollama").lower()
    
    if llm_provider == "openai":
        api_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1").rstrip("/")
        api_key = os.getenv("OPENAI_API_KEY", "")
        model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-3.5-turbo")
        
        url = f"{api_base}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model_name,
            "messages": messages,
            "stream": True,
            "temperature": 0.0
        }
        
        try:
            timeout = httpx.Timeout(120.0, connect=10.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    if response.status_code != 200:
                        err_text = await response.aread()
                        yield f"[Error: Cloud LLM API returned status {response.status_code}. Response: {err_text.decode('utf-8', errors='ignore')}]"
                        return
                    
                    async for line in response.aiter_lines():
                        line = line.strip()
                        if not line:
                            continue
                        if line == "data: [DONE]":
                            break
                        if line.startswith("data: "):
                            data_str = line[6:]
                            try:
                                chunk = json.loads(data_str)
                                content = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                if content:
                                    yield content
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            logger.error(f"Error streaming from Cloud LLM: {e}")
            err_msg = str(e) or type(e).__name__
            yield f"[Error: Failed to connect to Cloud LLM API: {err_msg}]"
        return

    # Default to local Ollama streaming
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

