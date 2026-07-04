# Lex AI - Personal AI Mentor

Lex AI is a modern, premium full-stack AI Mentor application featuring a responsive ChatGPT-style workspace, an active memory profile, vector-indexed document knowledge ingestion (RAG via ChromaDB), real-time Tavily web search integration, voice/TTS support, and a comprehensive administrator dashboard.

---

## Technical Stack
- **Frontend**: React (TypeScript) + Vite + Tailwind CSS v4 + Lucide Icons + Web Speech API (speech recognition and text-to-speech)
- **Backend**: Python FastAPI + Uvicorn
- **AI Engine**: Local Ollama (running the custom `lex` model based on `qwen2.5:1.5b`)
- **Database**: Local persistence JSON files + ChromaDB vector database

---

## Folder Structure

```
c:\AI\
├── backend\
│   ├── api\
│   │   └── main.py              # FastAPI server routes and endpoints
│   ├── models\
│   │   └── ollama_client.py     # Local Ollama connection client
│   ├── rag\
│   │   └── db.py                # ChromaDB document indexing & search helpers
│   ├── websearch\
│   │   └── search.py            # Tavily Search API client integrations
│   ├── memory\
│   │   ├── memory.json          # Basic user profile details
│   │   ├── progress.json        # Study roadmap and completed curriculum topics
│   │   └── chats.json           # Logged conversation sessions and messages
│   └── requirements.txt         # Python dependencies
│
├── frontend\
│   ├── src\
│   │   ├── components\
│   │   │   ├── Sidebar.tsx      # Sidebar navigation & history lists
│   │   │   └── ChatMessage.tsx  # Message renderer with markdown & TTS
│   │   ├── hooks\
│   │   │   ├── useTheme.ts      # Dark/light mode theme toggle
│   │   │   └── useSpeech.ts     # STT mic record and TTS audio reading
│   │   ├── pages\
│   │   │   ├── LandingPage.tsx  # Sleek introductory screen
│   │   │   ├── ChatPage.tsx     # Active prompt-response window
│   │   │   ├── ProfilePage.tsx  # Editable user profile tags
│   │   │   ├── ProgressPage.tsx # Radial stats and roadmap trees
│   │   │   ├── SettingsPage.tsx # Operational switches and toggles
│   │   │   └── AdminPage.tsx    # Database rebuilding and log viewers
│   │   ├── services\
│   │   │   └── api.ts           # Axios-free SSE streaming API client
│   │   ├── App.tsx              # React state and layout coordinator
│   │   └── index.css            # Base Tailwind imports & design styling
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── verify_backend.py            # Automatic connection testing script
└── README.md                    # Setup and guide reference (This file)
```

---

## Installation & Setup Instructions

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Python**: Version 3.10+ (Current workspace is verified on Python `3.13.4`)
- **Node.js**: Version 18+ (Current workspace is verified on Node `v22.20.0`)
- **Ollama**: Version 0.3.0+ (Installed local server)

### 2. Ollama Model Configuration
To create the custom `lex` model:
1. Make sure the local Ollama server is running (usually on `http://localhost:11434`).
2. Pull the base model if not already present:
   ```bash
   ollama pull qwen2.5:1.5b
   ```
3. Use the original `lex/ollamafile` inside the `lex` folder to build the `lex` model:
   ```bash
   cd c:\AI\lex
   ollama create lex -f ollamafile
   ```
4. Verify the model compiled successfully:
   ```bash
   ollama list
   ```
   *Expected output lists `lex:latest` in the output.*

### 3. Backend Setup
1. Open a terminal, go to the project directory, and install dependencies:
   ```bash
   cd c:\AI
   pip install -r backend/requirements.txt
   ```
2. Verify connections using the automated test suite:
   ```bash
   python verify_backend.py
   ```

### 4. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd c:\AI\frontend
   ```
2. Install package nodes:
   ```bash
   npm install
   ```

---

## Run Commands

To launch the entire platform, run the following commands in separate terminals:

### Launch Backend Server (Terminal 1)
```bash
cd c:\AI
python -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000
```
*The FastAPI server will be active at `http://127.0.0.1:8000`.*

### Launch Frontend Server (Terminal 2)
```bash
cd c:\AI\frontend
npm run dev
```
*The React dev server will print a local URI like `http://localhost:5173`. Open this URL in Chrome/Edge to start using Lex AI.*

---

## Application Feature Tour

1. **Start Workspace (`Home`)**: Discover Lex AI, browse structural features, and enter the workspace.
2. **Chat workspace (`Chat Workspace`)**: Experience interactive, streaming markdown responses. Talk directly into the microphone for voice queries, listen to responses using Text-to-Speech playback, download chats (.json), and toggle route options.
3. **User Curriculum (`Mentor Profile`)**: Customize personal parameters (Nickname, Locations, Target goals, core Skills, and Completed curriculums) to guide Lex's mentoring directions.
4. **Circular Roadmaps (`Learning Roadmap`)**: Review goal completion statistics, track complete achievements, and view structured timeline roadmap nodes.
5. **Operational Switches (`Settings`)**: Toggle Tavily internet crawlers, enable/disable memory context builders, select models, and change dark mode layouts.
6. **Administrator Dashboard (`Admin Panel`)**:
   - Check local Ollama nodes status and check model tags.
   - Upload text/Word/PDF documents to the knowledge folder.
   - Rebuild vector database (ChromaDB) from system files.
   - Audit Tavily search queries.
   - View formatted logs of `memory.json`, `progress.json`, and all historical `chats.json` sessions.
