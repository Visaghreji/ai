import json
import os
import sys
import socket
import chromadb
from ollama import chat
from sentence_transformers import SentenceTransformer

# Reconfigure stdout/stderr to support UTF-8 on Windows command lines
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# =====================================
# CONFIG
# =====================================


def load_dotenv(dotenv_path=".env"):
    if not os.path.exists(dotenv_path):
        return

    with open(dotenv_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value

load_dotenv()

OFFLINE_MODE_ENV = os.getenv("OFFLINE_MODE", "").strip().lower()
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")


def is_internet_available(timeout=2):
    endpoints = [
        ("1.1.1.1", 53),
        ("8.8.8.8", 53),
        ("example.com", 80)
    ]
    for host, port in endpoints:
        try:
            socket.create_connection((host, port), timeout=timeout).close()
            return True
        except Exception:
            continue
    return False

internet_available = is_internet_available()

if OFFLINE_MODE_ENV in ("1", "true", "yes"):
    OFFLINE_MODE = True
    AUTO_MODE = False
elif OFFLINE_MODE_ENV in ("0", "false", "no"):
    OFFLINE_MODE = False
    AUTO_MODE = False
else:
    OFFLINE_MODE = not internet_available
    AUTO_MODE = True

ENABLE_WEB_SEARCH = not OFFLINE_MODE and internet_available and bool(TAVILY_API_KEY)

if AUTO_MODE and not internet_available:
    print("[INFO] No internet connection detected. Running in offline mode.")

print(
    f"[INFO] AUTO_MODE={AUTO_MODE}. OFFLINE_MODE={OFFLINE_MODE}. "
    f"Web search is {'enabled' if ENABLE_WEB_SEARCH else 'disabled'}. "
    f"Internet available={internet_available}."
)

if internet_available:
    if TAVILY_API_KEY:
        print("[INFO] Internet available and TAVILY_API_KEY is set.")
    else:
        print("[WARNING] Internet is available but TAVILY_API_KEY is not set. Web search will remain disabled.")
else:
    print("[INFO] Internet unavailable; web search will be skipped.")


tavily = None
web_search_ready = False
if ENABLE_WEB_SEARCH:
    try:
        from tavily import TavilyClient

        tavily = TavilyClient(api_key=TAVILY_API_KEY)
        web_search_ready = True
    except Exception as e:
        tavily = None
        ENABLE_WEB_SEARCH = False
        print(f"[WARNING] Tavily client unavailable: {e}. Web search disabled.")

print(f"[INFO] Web search ready={web_search_ready}. TAVILY_API_KEY={'set' if TAVILY_API_KEY else 'missing'}.")


#modified

from ollama import chat

def route_question(question,history):

    q = question.lower()
    
     # Follow-up questions
    followups = [
         "more",
    "continue",
    "another",
    "2 more",
    "tell me more",
    "what about him",
    "his father",
    "her father",
    "advice",
    "career",
    "carrier"
    ]

    if any(x in q for x in followups):
        return "CHAT"

    if any(x in q for x in [
        "my name",
        "who am i",
        "my goals",
        "my skills",
        "my progress"
    ]):
        return "MEMORY"

    if any(x in q for x in [
        "latest",
        "live",
        "today",
        "news",
        "current",
        "update",
        "updates",
        "score",
        "match",
        "football",
        "fifa",
        "world cup",
        "weather",
        "stock",
        "institute",
        "hide",
        "kill",
        "do you know",
        "argentina",
        "manipulation"
        
    ]):
        return "WEB"

    if any(x in q for x in [
        "vulnerability",
        "cve",
        "cwe",
        "pentest",
        "security",
        "domain",
        "osint",
        "bug bounty",
        "exploit",
        "owasp",
        "mitre",
        "nmap",
        "cyber"
    ]):
        return "CYBER"

    if any(x in q for x in [
        "document",
        "notes",
        "knowledge",
        "pdf",
        "uploaded"
    ]):
        return "RAG"

    return "CHAT"

def analyze_domain(domain):
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

   

def search_web(query):

    if not ENABLE_WEB_SEARCH or tavily is None:
        print("WEB SEARCH DISABLED")
        return ""

    try:
        result = tavily.search(
            query=query,
            max_results=5
        )

        print("\n===== TAVILY RESULT =====")
        print(result)
        print("=========================\n")

        context = ""

        for item in result.get("results", []):
            context += f"""
Title: {item.get('title')}

Content:
{item.get('content')}

Source:
{item.get('url')}

--------------------------------
"""

        return context

    except Exception as e:
        print(f"[WARNING] Web search failed: {e}")
        return ""

        return context

    except Exception as e:
        print(f"[WARNING] Web search failed: {e}")
        return ""


def should_search_web(question):

    return ENABLE_WEB_SEARCH and tavily is not None

# =====================================
# LOAD USER DATA
# =====================================

with open("memory.json", "r", encoding="utf-8") as f:
    memory = json.load(f)

with open("progress.json", "r", encoding="utf-8") as f:
    progress = json.load(f)

# =====================================
# EMBEDDING MODEL
# =====================================

print("Loading embedding model...")

EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
EMBEDDING_MODEL_LOCAL_PATH = os.getenv("EMBEDDING_MODEL_LOCAL_PATH", "").strip()

try:
    if OFFLINE_MODE:
        if EMBEDDING_MODEL_LOCAL_PATH:
            embed_model = SentenceTransformer(
                EMBEDDING_MODEL_LOCAL_PATH,
                local_files_only=True
            )
        else:
            embed_model = SentenceTransformer(
                EMBEDDING_MODEL_NAME,
                local_files_only=True
            )
    else:
        embed_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
except Exception as e:
    raise RuntimeError(
        "Failed to load the embedding model in offline mode. "
        "Make sure the model is already downloaded and cached locally, or set "
        "EMBEDDING_MODEL_LOCAL_PATH to a local model folder. "
        f"Original error: {e}"
    )

# =====================================
# CHROMA DATABASE
# =====================================

client = chromadb.PersistentClient(
    path="./rag_db"
)

collection = client.get_or_create_collection(
    name="lex_knowledge"
)

# =====================================
# BUILD KNOWLEDGE BASE
# =====================================

def build_knowledge_base():

    knowledge_folder = "knowledge"

    if not os.path.exists(knowledge_folder):
        os.makedirs(knowledge_folder)

        print(
            "Created knowledge folder."
        )

        print(
            "Add .txt files inside it and restart."
        )

        return

    files = [
        f for f in os.listdir(knowledge_folder)
        if f.endswith(".txt")
    ]

    if not files:
        print("No knowledge files found.")
        return

    existing = collection.count()

    if existing > 0:
        print(
            "Knowledge base already exists."
        )
        return

    print("Building knowledge base...")

    doc_id = 0

    for file in files:

        path = os.path.join(
            knowledge_folder,
            file
        )

        with open(
            path,
            "r",
            encoding="utf-8"
        ) as f:

            text = f.read()

        chunk_size = 500

        chunks = [
            text[i:i + chunk_size]
            for i in range(
                0,
                len(text),
                chunk_size
            )
        ]

        for chunk in chunks:

            embedding = embed_model.encode(
                chunk
            ).tolist()

            collection.add(
                ids=[str(doc_id)],
                documents=[chunk],
                embeddings=[embedding]
            )

            doc_id += 1

    print(
        f"Added {doc_id} chunks."
    )

# =====================================
# RETRIEVE CONTEXT
# =====================================

def retrieve_context(query, top_k=10):

    if collection.count() == 0:
        return ""

    query_embedding = embed_model.encode(
        query
    ).tolist()

    results = collection.query(
        query_embeddings=[
            query_embedding
        ],
        n_results=top_k
    )

    docs = results["documents"][0]

    return "\n\n".join(docs)

# =====================================
# SYSTEM PROMPT
# =====================================

system_prompt = f"""
You are Lex, a friendly AI mentor.

IMPORTANT:
- Answer the user's CURRENT question.
- Do not repeat previous answers unless the user asks.
- If the user asks for career advice, give career advice.
- If the user asks for programming help, give programming help.
- Use conversation history to understand follow-up questions.
- Use previous conversation history.
- If the user says "more", "continue", "another", "2 more", "tell me more", refer to the previous topic.
- Never treat follow-up questions as unrelated unless the user changes the topic.
- Your name is Lex.
- The user's name is {progress['profile']['name']}.
- The user's nickname is {progress['profile']['nickname']}.
- Never say your name is the user's name.
- Never say your nickname is the user's nickname.
- The nickname belongs to the user.

User Profile:
Name: {progress['profile']['name']}
Nickname: {progress['profile']['nickname']}
Location: {progress['profile']['location']}

Goals:
{', '.join(progress['goals'])}

Current Topics:
{', '.join(progress['current_topics'])}

Skills:
{', '.join(progress['skills'])}

Completed Topics:
{', '.join(progress['completed_topics'])}

Rules:
- Be friendly.
- Explain concepts simply.
- Use examples.
- Help with Python, AI,
  Quantum Computing,
  Cybersecurity.
- Never pretend to be user.
- Use retrieved knowledge
  when available.
- If there is not enough
  information, say you do not know.
"""

# =====================================
# BUILD DATABASE
# =====================================

build_knowledge_base()

# =====================================
# START
# =====================================

print("\n🤖 Lex is online!")
print("Type exit to quit")
print("Type progress to view dashboard\n")

chat_history = []

while True:

    question = input("You: ").strip()
    chat_history.append({
    "role": "user",
    "content": question
})

    if question.lower() in [
        "exit",
        "quit",
        "bye",
        "0"
    ]:

        print(
            "\nLex: Goodbye! 🚀"
        )

        break

    # Progress Dashboard
    if question.lower() == "progress":

        print("\n========== PROGRESS ==========")

        print("\nGoals:")
        for goal in progress["goals"]:
            print(f"- {goal}")

        print("\nCurrent Topics:")
        for topic in progress["current_topics"]:
            print(f"- {topic}")

        print("\nCompleted Topics:")
        if progress["completed_topics"]:
            for topic in progress[
                "completed_topics"
            ]:
                print(f"- {topic}")
        else:
            print("None")

        print("\n==============================\n")

        continue

 
    # =====================================
    # ROUTE REQUEST
    # =====================================
    
    
    
    
    route = route_question(question, chat_history)

    print(f"\n[ROUTE: {route}]")

    if route == "WEB":

        print("\n[Searching Web...]")

        context = search_web(question)

    elif route == "MEMORY":

        print("\n[Using Memory...]")

        context = f"""
    Name: {progress['profile']['name']}
    Nickname: {progress['profile']['nickname']}

    Goals:
    {', '.join(progress['goals'])}

    Skills:
    {', '.join(progress['skills'])}

    Current Topics:
    {', '.join(progress['current_topics'])}
    """

    elif route == "RAG":

        print("\n[Searching Knowledge Base...]")

        context = retrieve_context(question)

    elif route == "CYBER":

        print("\n[Cybersecurity Analysis Mode Enabled]")
        
        # Simple domain extraction heuristic
        words = question.strip().split()
        domain = None
        for word in words:
            if "." in word and len(word) > 3 and not word.startswith("http"):
                # clean common punctuation
                cleaned = word.strip("?,.:;!\"'")
                domain = cleaned
                break
        
        if domain:
            domain_info = analyze_domain(domain)
            rag_context = retrieve_context(question)
            context = f"{domain_info}\n\nSecurity Knowledge context:\n{rag_context}"
        else:
            context = retrieve_context(question)

    else:

        print("\n[Normal Chat Mode...]")

        context = ""
    recent_history = ""

    for msg in chat_history[-10:]:
     recent_history += f"{msg['role']}: {msg['content']}\n"    

    enhanced_prompt = f"""
    Context:

    {context}

    Question:
    {question}

    Rules:
    - Use the context above.
    - If the context is from web search,
    answer using the latest information.
    - If context is empty,
    answer honestly and say you do not know if unsure.
    - Never make up current events.
    """

    messages = [
    {
        "role": "system",
        "content": system_prompt
    }
]

# Add previous conversation
    messages.extend(chat_history[-10:])

# Current message with context
    messages.append({
    "role": "user",
    "content": enhanced_prompt
})

    try:

        stream = chat(
            model="lex",
            messages=messages,
            stream=True
        )

        print("\nLex: ", end="")

        answer = ""

        for chunk in stream:

            piece = chunk["message"]["content"]

            answer += piece

            print(
                piece,
                end="",
                flush=True
            )

        print("\n")
        chat_history.append({
    "role": "assistant",
    "content": answer
})

    except Exception as e:

        print(
            f"\n[ERROR] {e}\n"
        )