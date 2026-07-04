import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  Trash2,
  Download,
  RefreshCw,
  Upload,
  HelpCircle,
  Globe,
  Brain,
  FileText,
  ChevronRight,
  Settings as SettingsIcon,
} from "lucide-react";
import { Message, Settings, streamChat, uploadFile } from "../services/api";
import { ChatMessage } from "../components/ChatMessage";
import { useSpeech } from "../hooks/useSpeech";

interface ChatPageProps {
  sessionId: string;
  sessionTitle: string;
  messages: Message[];
  settings: Settings;
  onUpdateMessages: (updater: (prev: Message[]) => Message[]) => void;
  onRefreshHistory: () => void;
}

export function ChatPage({
  sessionId,
  sessionTitle,
  messages,
  settings,
  onUpdateMessages,
  onRefreshHistory,
}: ChatPageProps) {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<string>("");
  const [currentSources, setCurrentSources] = useState<any[]>([]);
  const [speakingMessageIdx, setSpeakingMessageIdx] = useState<number | null>(
    null,
  );
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isListening,
    isSpeaking,
    voiceSupported,
    ttsSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useSpeech();

  // Scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Handle Speech Recognition Result
  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((text) => {
        setInput(text);
      });
    }
  };

  // Handle Speech Synthesis
  const handleSpeak = (text: string, index: number) => {
    if (speakingMessageIdx === index) {
      stopSpeaking();
      setSpeakingMessageIdx(null);
    } else {
      setSpeakingMessageIdx(index);
      speak(text, () => {
        setSpeakingMessageIdx(null);
      });
    }
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setSpeakingMessageIdx(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      setUploadingFile(true);
      setUploadStatus(`Uploading ${file.name}...`);
      const res = await uploadFile(file);
      if (res.success) {
        setUploadStatus(
          `✓ Uploaded ${file.name}. Added ${res.chunks_added || 0} chunks.`,
        );
      } else {
        setUploadStatus(`⚠️ Upload failed: ${res.message}`);
      }
    } catch (error: any) {
      setUploadStatus(`⚠️ ${error.message || "Upload failed."}`);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Submit Prompt
  const handleSend = async (messageText = input) => {
    if (!messageText.trim() || isStreaming) return;

    setInput("");
    stopSpeaking();
    setSpeakingMessageIdx(null);

    // Add user message
    const userMsg: Message = { role: "user", content: messageText };
    onUpdateMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setCurrentRoute("");
    setCurrentSources([]);

    // Add empty assistant response to stream into
    const assistantMsg: Message = { role: "assistant", content: "" };
    onUpdateMessages((prev) => [...prev, assistantMsg]);

    let receivedContent = "";
    let receivedSources: any[] = [];
    let receivedRoute = "";

    await streamChat(
      sessionId,
      messageText,
      settings,
      (meta) => {
        receivedRoute = meta.route;
        receivedSources = meta.sources;
        setCurrentRoute(meta.route);
        setCurrentSources(meta.sources);

        onUpdateMessages((prev) => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              sources: receivedSources,
            };
          }
          return updated;
        });
      },
      (chunk) => {
        receivedContent += chunk;
        onUpdateMessages((prev) => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: receivedContent,
            };
          }
          return updated;
        });
      },
      (err) => {
        setIsStreaming(false);
        onUpdateMessages((prev) => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              role: "assistant",
              content: `⚠️ Error: ${err}. Make sure the backend server and Ollama are running.`,
            };
          }
          return updated;
        });
      },
      () => {
        setIsStreaming(false);
        onRefreshHistory();
      },
    );
  };

  // Export current session
  const handleExport = () => {
    if (messages.length === 0) return;
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          {
            sessionId,
            sessionTitle,
            exportedAt: new Date().toISOString(),
            messages,
          },
          null,
          2,
        ),
      );

    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `lex_chat_${sessionId.slice(0, 6)}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Clear current chat display (reset state)
  const handleClearDisplay = () => {
    onUpdateMessages(() => []);
    setCurrentRoute("");
    setCurrentSources([]);
    stopSpeaking();
    setSpeakingMessageIdx(null);
  };

  // Re-trigger last query
  const handleRegenerate = () => {
    if (messages.length < 2 || isStreaming) return;

    // Find last user query
    const userMessages = messages.filter((m) => m.role === "user");
    if (userMessages.length === 0) return;
    const lastUserQuery = userMessages[userMessages.length - 1].content;

    // Remove last assistant message
    onUpdateMessages((prev) => prev.slice(0, -1));
    handleSend(lastUserQuery);
  };

  const getRouteBadge = () => {
    if (!currentRoute || currentRoute === "CHAT") return null;

    let color = "from-slate-500 to-slate-600";
    let icon = <Brain className="w-3 h-3" />;

    if (currentRoute === "WEB") {
      color = "from-sky-500 to-blue-500";
      icon = <Globe className="w-3 h-3" />;
    } else if (currentRoute === "RAG") {
      color = "from-emerald-500 to-teal-500";
      icon = <FileText className="w-3 h-3" />;
    } else if (currentRoute === "MEMORY") {
      color = "from-purple-500 to-violet-500";
      icon = <Brain className="w-3 h-3" />;
    }

    return (
      <div
        className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white rounded-full bg-gradient-to-r ${color} shadow-sm uppercase tracking-wider`}
      >
        {icon}
        <span>Route: {currentRoute}</span>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950/20 relative">
      {/* Header Bar */}
      <header className="h-16 border-b border-slate-200/40 dark:border-slate-800/40 glass px-6 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-white truncate text-sm sm:text-base max-w-[200px] sm:max-w-xs">
              {sessionTitle}
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Session ID: {sessionId.slice(0, 8)}
            </p>
          </div>
          {getRouteBadge()}
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <button
                onClick={handleExport}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Export Chat (.json)"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleClearDisplay}
                className="p-2 rounded-xl text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Clear Chat Screen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main chat output container */}
      <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-primary-500/10 mb-6">
              Lex
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2">
              Welcome to your Chat Workspace
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              Start typing below or trigger voice inputs. You can upload local
              documents in the Admin Panel or toggle live web searches to enrich
              Lex's memory.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {[
                "How does python list comprehension work?",
                "Create a learning roadmap for AI",
                "Explain quantum computing in simple terms",
                "Tell me about my learning goals",
              ].map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(sample);
                    handleSend(sample);
                  }}
                  className="p-3 text-xs border border-slate-200/50 dark:border-slate-800/40 rounded-xl glass hover:bg-white dark:hover:bg-slate-900/60 transition text-slate-600 dark:text-slate-300 font-medium"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map((msg, index) => (
              <ChatMessage
                key={index}
                message={msg}
                isStreaming={isStreaming && index === messages.length - 1}
                onRegenerate={
                  index === messages.length - 1 && msg.role === "assistant"
                    ? handleRegenerate
                    : undefined
                }
                onSpeak={
                  ttsSupported && msg.role === "assistant"
                    ? (text) => handleSpeak(text, index)
                    : undefined
                }
                onStopSpeaking={handleStopSpeaking}
                isSpeakingThis={speakingMessageIdx === index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Prompt Input Form */}
      <footer className="p-4 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent flex-shrink-0 z-10">
        <div className="max-w-4xl mx-auto relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 rounded-2xl glass border border-slate-200/60 dark:border-slate-800/60 px-4 py-2.5 shadow-lg shadow-slate-200/5 dark:shadow-black/5"
          >
            {voiceSupported && (
              <button
                type="button"
                onClick={handleMicClick}
                className={`p-2 rounded-xl border transition ${
                  isListening
                    ? "bg-red-500 text-white border-red-500 animate-pulse"
                    : "border-slate-200/60 dark:border-slate-700/50 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                title={isListening ? "Stop Voice Typing" : "Start Voice Typing"}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            )}

            <label htmlFor="chat-input" className="sr-only">
              Chat message
            </label>
            <input
              id="chat-input"
              type="text"
              placeholder={
                isListening ? "Listening..." : "Message Lex AI Mentor..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming}
              className="flex-1 bg-transparent border-none outline-none py-1 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:ring-0"
            />

            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              title="Send chat message"
              aria-label="Send chat message"
              className={`p-2.5 rounded-xl transition ${
                input.trim() && !isStreaming
                  ? "bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-500/20"
                  : "bg-slate-200/60 dark:bg-slate-900/60 text-slate-400 dark:text-slate-600 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.pdf,.docx"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming || uploadingFile}
              className="p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/50 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Upload PDF or document to knowledge base"
              aria-label="Upload PDF or document to knowledge base"
            >
              <Upload className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-2 px-2 flex flex-col gap-1 text-[10px] text-slate-400 dark:text-slate-500">
            <span>
              Model: {settings.modelName} • Memory{" "}
              {settings.enableMemory ? "On" : "Off"}
            </span>
            <span>Press Enter to send</span>
            {uploadStatus && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {uploadStatus}
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
