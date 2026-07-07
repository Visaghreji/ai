const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

export function getApiBase(): string {
  return localStorage.getItem("LEX_API_BASE") || DEFAULT_API_BASE;
}

export function setApiBase(url: string) {
  if (!url) {
    localStorage.removeItem("LEX_API_BASE");
  } else {
    localStorage.setItem("LEX_API_BASE", url);
  }
}

export interface Settings {
  modelName: string;
  enableWebSearch: boolean;
  enableMemory: boolean;
}

export interface Source {
  name: string;
  url?: string;
  type: "file" | "web" | "memory";
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  sources?: Source[];
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp?: string;
  messages?: Message[];
}

export interface Profile {
  name: string;
  nickname: string;
  location: string;
  age: number;
  goals: string[];
  skills: string[];
  current_topics: string[];
  completed_topics: string[];
}

export interface ProgressStats {
  profile: Profile;
  goals: string[];
  completed_topics: string[];
  current_topics: string[];
  skills: string[];
  completed_percentage: number;
  stats: {
    goals_count: number;
    skills_count: number;
    completed_count: number;
    current_count: number;
  };
}

export interface KnowledgeFile {
  name: string;
  size: number;
  type: string;
}

export interface OllamaStatus {
  online: boolean;
  models: string[];
  has_lex_model: boolean;
  message: string;
}

// -------------------------------------------------------------
// Chat History APIs
// -------------------------------------------------------------

export async function fetchHistory(): Promise<ChatSession[]> {
  const res = await fetch(`${getApiBase()}/history`);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function fetchSessionDetails(
  sessionId: string,
): Promise<ChatSession> {
  const res = await fetch(`${getApiBase()}/history/${sessionId}`);
  if (!res.ok) throw new Error("Failed to fetch session details");
  return res.json();
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  const res = await fetch(`${getApiBase()}/history/${sessionId}`, {
    method: "DELETE",
  });
  return res.ok;
}

export async function clearAllHistory(): Promise<boolean> {
  const res = await fetch(`${getApiBase()}/history/clear`, { method: "POST" });
  return res.ok;
}

// -------------------------------------------------------------
// Profile & Progress APIs
// -------------------------------------------------------------

export async function fetchProfile(): Promise<Profile> {
  const res = await fetch(`${getApiBase()}/profile`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function saveProfile(profile: Profile): Promise<boolean> {
  const res = await fetch(`${getApiBase()}/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  return res.ok;
}

export async function fetchProgress(): Promise<ProgressStats> {
  const res = await fetch(`${getApiBase()}/progress`);
  if (!res.ok) throw new Error("Failed to fetch progress stats");
  return res.json();
}

// -------------------------------------------------------------
// RAG File Upload
// -------------------------------------------------------------

export async function uploadFile(
  file: File,
): Promise<{ success: boolean; message: string; chunks_added?: number }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${getApiBase()}/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to upload file");
  }
  return res.json();
}

// -------------------------------------------------------------
// Admin APIs
// -------------------------------------------------------------

export async function fetchAdminChats(): Promise<ChatSession[]> {
  const res = await fetch(`${getApiBase()}/admin/chats`);
  if (!res.ok) throw new Error("Failed to fetch admin chats");
  const data = await res.json();
  return data.sessions || [];
}

export async function fetchAdminMemory(): Promise<any> {
  const res = await fetch(`${getApiBase()}/admin/memory`);
  if (!res.ok) throw new Error("Failed to fetch raw memory");
  return res.json();
}

export async function fetchAdminProgress(): Promise<any> {
  const res = await fetch(`${getApiBase()}/admin/progress`);
  if (!res.ok) throw new Error("Failed to fetch raw progress");
  return res.json();
}

export async function rebuildDatabase(): Promise<{
  success: boolean;
  total_files: number;
  total_chunks: number;
}> {
  const res = await fetch(`${getApiBase()}/admin/rebuild-db`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to rebuild ChromaDB");
  return res.json();
}

export async function checkOllama(): Promise<OllamaStatus> {
  const res = await fetch(`${getApiBase()}/admin/ollama-status`);
  if (!res.ok) throw new Error("Failed to fetch Ollama status");
  return res.json();
}

export async function testSearch(
  query: string,
): Promise<{ context: string; sources: Source[] }> {
  const res = await fetch(`${getApiBase()}/web-search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error("Web search test failed");
  return res.json();
}

// -------------------------------------------------------------
// SSE Streaming Chat Reader
// -------------------------------------------------------------

export async function streamChat(
  sessionId: string,
  message: string,
  settings: Settings,
  onMetadata: (metadata: { route: string; sources: Source[] }) => void,
  onChunk: (text: string) => void,
  onError: (err: string) => void,
  onDone: () => void,
) {
  try {
    const res = await fetch(`${getApiBase()}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message, settings }),
    });

    if (!res.ok) {
      onError(`Server returned status ${res.status}`);
      return;
    }

    if (!res.body) {
      onError("Response stream is empty");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      // Keep last incomplete line in buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine.startsWith("data: ")) continue;

        const dataStr = cleanLine.substring(6);
        if (dataStr === "[DONE]") {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.type === "metadata") {
            onMetadata({
              route: parsed.route,
              sources: parsed.sources || [],
            });
          } else if (parsed.type === "chunk") {
            onChunk(parsed.content);
          }
        } catch (e) {
          console.warn("Error parsing stream chunk:", e);
        }
      }
    }

    onDone();
  } catch (error: any) {
    onError(error.message || "Failed to communicate with backend");
  }
}
