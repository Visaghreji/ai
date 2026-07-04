import os
import logging
from typing import Dict, List, Tuple
from tavily import TavilyClient

logger = logging.getLogger("lex-backend")

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# Initialize Tavily client if API key is provided
tavily_client = None
if TAVILY_API_KEY:
    try:
        tavily_client = TavilyClient(api_key=TAVILY_API_KEY)
        logger.info("Tavily client initialized successfully.")
    except Exception as e:
        logger.warning(f"Failed to initialize Tavily client: {e}")

def run_web_search(query: str, max_results: int = 5) -> Tuple[str, List[Dict[str, str]]]:
    """Runs a web search using Tavily and formats the context and sources."""
    global tavily_client
    
    if not tavily_client:
        logger.warning("Tavily client is not configured. Web search skipped.")
        return "", []
        
    try:
        # Perform Tavily search
        logger.info(f"Running web search for: '{query}'")
        result = tavily_client.search(
            query=query,
            max_results=max_results
        )
        
        context = ""
        sources = []
        
        results_list = result.get("results", [])
        for item in results_list:
            title = item.get("title", "No Title")
            content = item.get("content", "")
            url = item.get("url", "")
            
            context += f"Title: {title}\nURL: {url}\nContent:\n{content}\n\n---\n\n"
            sources.append({
                "name": title,
                "url": url,
                "type": "web"
            })
            
        return context.strip(), sources
    except Exception as e:
        logger.error(f"Tavily web search error: {e}")
        return f"[Web search failed: {str(e)}]", []
