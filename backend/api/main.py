import os
import json
import logging
import uuid
from typing import List, Dict, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.models.ollama_client import check_ollama_status, stream_ollama_chat
from backend.rag.db import (
    query_rag_knowledge, 
    add_document_to_db, 
    rebuild_chromadb_index, 
    list_knowledge_files,
    KNOWLEDGE_DIR
)
from backend.websearch.search import run_web_search

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lex-backend")

app = FastAPI(title="Lex AI Backend", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_private_network=True,
)

# File paths
MEMORY_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "memory"))
MEMORY_FILE = os.path.join(MEMORY_DIR, "memory.json")
PROGRESS_FILE = os.path.join(MEMORY_DIR, "progress.json")
CHATS_FILE = os.path.join(MEMORY_DIR, "chats.json")

os.makedirs(MEMORY_DIR, exist_ok=True)

# Helper functions to load/save JSON stores
def load_json_file(file_path: str, default_data: any) -> any:
    if not os.path.exists(file_path):
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(default_data, f, indent=2)
        return default_data
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading file {file_path}: {e}")
        return default_data

def save_json_file(file_path: str, data: any):
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving file {file_path}: {e}")

# Initialize JSON stores
load_json_file(MEMORY_FILE, {"name": "User", "interests": [], "goal": [], "python_level": "Beginner"})
load_json_file(PROGRESS_FILE, {
    "profile": {"name": "Visagh Reji", "nickname": "Knight", "age": 20, "location": "Kerala, India"},
    "goals": ["Learn AI", "Become Full Stack Dev"],
    "learning": {"python_level": "Beginner"},
    "completed_topics": [],
    "current_topics": ["Ollama", "FastAPI"],
    "skills": ["Python"]
})
load_json_file(CHATS_FILE, {"sessions": []})

# Pydantic Schemas
class SettingsModel(BaseModel):
    modelName: str = "lex"
    enableWebSearch: bool = True
    enableMemory: bool = True

class ChatRequest(BaseModel):
    sessionId: str
    message: str
    settings: Optional[SettingsModel] = SettingsModel()

class ProfileUpdate(BaseModel):
    name: str
    nickname: str
    location: str
    age: int
    goals: List[str]
    skills: List[str]
    current_topics: List[str]
    completed_topics: List[str]

class TestSearchRequest(BaseModel):
    query: str

# Query Routing
def route_question(question: str) -> str:
    q = question.lower()
    
    # Follow-up questions
    followups = [
        "more", "continue", "another", "2 more", "tell me more", 
        "what about him", "his father", "her father", "advice", "career", "carrier"
    ]
    if any(x in q for x in followups):
        return "CHAT"

    # Memory reference triggers
    if any(x in q for x in ["my name", "who am i", "my goals", "my skills", "my progress"]):
        return "MEMORY"

    # Web search triggers
    if any(x in q for x in [
        "latest", "live", "today", "news", "current", "update", "updates", 
        "score", "match", "football", "fifa", "world cup", "weather", 
        "stock", "institute", "hide", "kill", "do you know", "argentina"
    ]):
        return "WEB"

    # Cyber triggers
    if any(x in q for x in [
        "vulnerability", "cve", "cwe", "pentest", "security", "domain", 
        "osint", "bug bounty", "exploit", "owasp", "mitre", "nmap", "cyber"
    ]):
        return "CYBER"

    # RAG search triggers
    if any(x in q for x in ["document", "notes", "knowledge", "pdf", "docx", "uploaded"]):
        return "RAG"

    return "CHAT"

def analyze_domain(domain: str) -> str:
    import socket
    try:
        ip = socket.gethostbyname(domain)
        return f"""
        Domain: {domain}
        Resolved IP: {ip}

        Security Review:
        - DNS Resolution Successful
        - Further Analysis Recommended
        """
    except Exception as e:
        return f"Domain lookup failed: {e}"

# -------------------------------------------------------------
# REST Endpoints
# -------------------------------------------------------------

@app.get("/api/history")
async def get_history():
    """Returns chat session history (id and title)."""
    chats_data = load_json_file(CHATS_FILE, {"sessions": []})
    sessions = []
    for s in chats_data.get("sessions", []):
        sessions.append({
            "id": s["id"],
            "title": s.get("title", "New Conversation"),
            "timestamp": s.get("timestamp", "")
        })
    return sessions

@app.get("/api/history/{session_id}")
async def get_session_details(session_id: str):
    """Returns all messages of a specific session."""
    chats_data = load_json_file(CHATS_FILE, {"sessions": []})
    for s in chats_data.get("sessions", []):
        if s["id"] == session_id:
            return s
    raise HTTPException(status_code=404, detail="Session not found")

@app.delete("/api/history/{session_id}")
async def delete_session(session_id: str):
    """Deletes a chat session."""
    chats_data = load_json_file(CHATS_FILE, {"sessions": []})
    sessions = chats_data.get("sessions", [])
    updated = [s for s in sessions if s["id"] != session_id]
    chats_data["sessions"] = updated
    save_json_file(CHATS_FILE, chats_data)
    return {"success": True}

@app.post("/api/history/clear")
async def clear_all_history():
    """Deletes all chat sessions."""
    save_json_file(CHATS_FILE, {"sessions": []})
    return {"success": True}

@app.get("/api/profile")
async def get_profile():
    """Fetches profile configuration data."""
    return load_json_file(PROGRESS_FILE, {})

@app.post("/api/profile")
async def update_profile(profile: ProfileUpdate):
    """Updates user profile configurations."""
    progress = load_json_file(PROGRESS_FILE, {})
    progress["profile"] = {
        "name": profile.name,
        "nickname": profile.nickname,
        "location": profile.location,
        "age": profile.age
    }
    progress["goals"] = profile.goals
    progress["skills"] = profile.skills
    progress["current_topics"] = profile.current_topics
    progress["completed_topics"] = profile.completed_topics
    
    # Save back to disk
    save_json_file(PROGRESS_FILE, progress)
    
    # Sync basic memory file
    memory = load_json_file(MEMORY_FILE, {})
    memory["name"] = profile.name
    memory["goal"] = profile.goals
    save_json_file(MEMORY_FILE, memory)
    
    return {"success": True, "data": progress}

@app.get("/api/progress")
async def get_progress():
    """Computes stats and details of learning roadmap."""
    progress = load_json_file(PROGRESS_FILE, {})
    
    total_goals = len(progress.get("goals", []))
    completed_topics_count = len(progress.get("completed_topics", []))
    current_topics_count = len(progress.get("current_topics", []))
    
    # Simple learning progress percentage
    completed_percentage = 0
    if total_goals > 0:
        completed_percentage = int((completed_topics_count / (completed_topics_count + current_topics_count + 1.0)) * 100)
        
    return {
        "profile": progress.get("profile", {}),
        "goals": progress.get("goals", []),
        "completed_topics": progress.get("completed_topics", []),
        "current_topics": progress.get("current_topics", []),
        "skills": progress.get("skills", []),
        "completed_percentage": min(completed_percentage, 100),
        "stats": {
            "goals_count": total_goals,
            "skills_count": len(progress.get("skills", [])),
            "completed_count": completed_topics_count,
            "current_count": current_topics_count
        }
    }

@app.post("/api/web-search")
async def test_search(req: TestSearchRequest):
    """Manual search tester."""
    context, sources = run_web_search(req.query)
    return {"context": context, "sources": sources}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Uploads a text or pdf file and indexes it in ChromaDB."""
    os.makedirs(KNOWLEDGE_DIR, exist_ok=True)
    file_path = os.path.join(KNOWLEDGE_DIR, file.filename)
    
    # Save file locally
    with open(file_path, "wb") as f:
        f.write(await file.read())
        
    try:
        # Ingest file into database
        chunks_added = add_document_to_db(file_path)
        return {
            "success": True,
            "filename": file.filename,
            "chunks_added": chunks_added,
            "message": f"Successfully ingested {file.filename}."
        }
    except Exception as e:
        logger.error(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

# -------------------------------------------------------------
# Admin APIs
# -------------------------------------------------------------

@app.get("/api/admin/chats")
async def get_admin_chats():
    """Retrieve full logs of all chat sessions."""
    return load_json_file(CHATS_FILE, {"sessions": []})

@app.get("/api/admin/memory")
async def get_admin_memory():
    """Returns memory.json."""
    return load_json_file(MEMORY_FILE, {})

@app.get("/api/admin/progress")
async def get_admin_progress():
    """Returns progress.json."""
    return load_json_file(PROGRESS_FILE, {})

@app.post("/api/admin/rebuild-db")
async def rebuild_rag_db(background_tasks: BackgroundTasks):
    """Triggers ChromaDB rebuilding based on knowledge directory."""
    # Rebuild synchronously for direct client feedback
    try:
        result = rebuild_chromadb_index()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rebuild failed: {str(e)}")

@app.get("/api/admin/ollama-status")
async def get_admin_ollama():
    """Retrieves status of local Ollama system."""
    return await check_ollama_status()

# -------------------------------------------------------------
# Streaming Chat Interface
# -------------------------------------------------------------

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    """Chat endpoint supporting SSE streaming."""
    # Load profile data
    progress = load_json_file(PROGRESS_FILE, {})
    profile = progress.get("profile", {"name": "User", "nickname": "Friend"})
    
    # Format system prompt with personal context
    system_prompt = f"""You are Lex, a friendly and patient AI mentor.
    
Your name is Lex.
The user's name is {profile.get('name', 'User')}.
The user's nickname is {profile.get('nickname', 'Friend')}.
Location: {profile.get('location', 'Kerala, India')}.
User Goals: {', '.join(progress.get('goals', []))}.
User Skills: {', '.join(progress.get('skills', []))}.
Current Learning Topics: {', '.join(progress.get('current_topics', []))}.

Behavioral Guidelines:
- Answer the user's current question simply and using real-world examples.
- Celebrate achievements and encourage learning through practical exercises.
- If the context contains sources, display references appropriately.
- If the user asks about uploaded PDF or document content, answer directly from the retrieved text.
- If the answer exists in the retrieved context, do not say the source lacks the information.
- Never invent answers not supported by the retrieved context.
- Never pretend to be the user or speak on the user's behalf.
"""

    # Retrieve history context
    chats_data = load_json_file(CHATS_FILE, {"sessions": []})
    session = None
    for s in chats_data.get("sessions", []):
        if s["id"] == req.sessionId:
            session = s
            break
            
    if not session:
        # Create a new session if not found
        session = {
            "id": req.sessionId,
            "title": req.message[:40] + "..." if len(req.message) > 40 else req.message,
            "messages": []
        }
        chats_data["sessions"].insert(0, session)
        save_json_file(CHATS_FILE, chats_data)

    # Route classification
    route = "CHAT"
    if req.settings and req.settings.enableMemory:
        route = route_question(req.message)
        
    context = ""
    sources = []
    
    logger.info(f"Classified route: {route} for input: '{req.message}'")
    
    # Handle routes
    if route == "RAG":
        context, sources = query_rag_knowledge(req.message)
    elif route == "WEB" and req.settings and req.settings.enableWebSearch:
        context, sources = run_web_search(req.message)
    elif route == "CYBER":
        # Extract domain
        words = req.message.strip().split()
        domain = None
        for word in words:
            if "." in word and len(word) > 3 and not word.startswith("http"):
                cleaned = word.strip("?,.:;!\"'")
                domain = cleaned
                break
        
        rag_context, rag_sources = query_rag_knowledge(req.message)
        sources = rag_sources
        
        if domain:
            domain_info = analyze_domain(domain)
            context = f"Cybersecurity Analysis Mode Enabled\n\n{domain_info}\n\nSecurity Knowledge:\n{rag_context}"
            sources.append({"name": f"Domain Lookup: {domain}", "type": "cyber"})
        else:
            context = f"Cybersecurity Analysis Mode Enabled\n\nSecurity Knowledge:\n{rag_context}"
    elif route == "MEMORY":
        context = f"""
        User Profile Memory:
        Name: {profile.get('name')}
        Nickname: {profile.get('nickname')}
        Goals: {progress.get('goals')}
        Skills: {progress.get('skills')}
        Current Topics: {progress.get('current_topics')}
        """
        sources = [{"name": "Memory Profile", "type": "memory"}]

    # Enhance user message with context
    enhanced_content = req.message
    if context:
        enhanced_content = f"Context:\n{context}\n\nQuestion:\n{req.message}\n\nRules:\n- Use the above context to answer.\n- If the answer is present in the context, respond directly from it.\n- Do not invent details that are not in the retrieved text.\n- If the user asks specifically about the uploaded PDF, do not answer from general knowledge instead of the PDF."

    # Build prompt messages for Ollama (include last 6 messages of history for short context memory)
    ollama_messages = [{"role": "system", "content": system_prompt}]
    
    # Append recent chat history
    for msg in session["messages"][-6:]:
        ollama_messages.append({"role": msg["role"], "content": msg["content"]})
        
    # Append current enhanced question
    ollama_messages.append({"role": "user", "content": enhanced_content})
    
    # Update backend log of the chat session with raw user message
    session["messages"].append({
        "role": "user", 
        "content": req.message
    })
    save_json_file(CHATS_FILE, chats_data)

    # Streaming Response Generator
    async def response_generator():
        # First send metadata (sources)
        metadata = {
            "type": "metadata",
            "route": route,
            "sources": sources
        }
        yield f"data: {json.dumps(metadata)}\n\n"
        
        # Stream model response chunks
        assistant_content = ""
        model_name = req.settings.modelName if req.settings else "lex"
        
        async for chunk in stream_ollama_chat(ollama_messages, model=model_name):
            assistant_content += chunk
            yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
            
        # Append completed assistant reply to session
        chats_data_latest = load_json_file(CHATS_FILE, {"sessions": []})
        for s in chats_data_latest.get("sessions", []):
            if s["id"] == req.sessionId:
                # Add source detail to history message
                s["messages"].append({
                    "role": "assistant",
                    "content": assistant_content,
                    "sources": sources
                })
                # Auto generate a better title if it is the first exchange
                if len(s["messages"]) <= 2:
                    s["title"] = req.message[:30] + "..." if len(req.message) > 30 else req.message
                break
        save_json_file(CHATS_FILE, chats_data_latest)
        yield "data: [DONE]\n\n"

    return StreamingResponse(response_generator(), media_type="text/event-stream")
