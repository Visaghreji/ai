import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Menu } from "lucide-react";
import { LandingPage } from "./pages/LandingPage";
import { ChatPage } from "./pages/ChatPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProgressPage } from "./pages/ProgressPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AdminPage } from "./pages/AdminPage";
import { useTheme } from "./hooks/useTheme";
import { 
  ChatSession, Message, Settings, 
  fetchHistory, fetchSessionDetails, 
  deleteSession, clearAllHistory 
} from "./services/api";

export function App() {
  const { theme, toggleTheme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<string>("landing");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [sessionTitle, setSessionTitle] = useState<string>("New Conversation");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  
  const [settings, setSettings] = useState<Settings>({
    modelName: "lex",
    enableWebSearch: true,
    enableMemory: true
  });

  // Load chat history logs on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await fetchHistory();
      setSessions(data);
      
      // If there are sessions and no currentSessionId, load the latest one
      if (data.length > 0 && !currentSessionId) {
        handleSelectSession(data[0].id);
      } else if (data.length === 0 && !currentSessionId) {
        handleCreateSession();
      }
    } catch (e) {
      console.warn("Could not load chat history. Ensure backend server is running.");
      // Create local fallback session
      handleCreateSession();
    }
  };

  const handleSelectSession = async (id: string) => {
    setCurrentSessionId(id);
    try {
      const session = await fetchSessionDetails(id);
      setSessionTitle(session.title || "New Conversation");
      setMessages(session.messages || []);
    } catch (e) {
      console.error("Failed to load session details:", e);
      setMessages([]);
    }
  };

  const handleCreateSession = () => {
    // Generate simple local GUID
    const newId = "session_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    setCurrentSessionId(newId);
    setSessionTitle("New Conversation");
    setMessages([]);
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession(id);
      // Update local state
      const updated = sessions.filter(s => s.id !== id);
      setSessions(updated);
      
      if (currentSessionId === id) {
        if (updated.length > 0) {
          handleSelectSession(updated[0].id);
        } else {
          handleCreateSession();
        }
      }
    } catch (e) {
      console.error("Failed to delete session:", e);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to delete ALL chat sessions?")) return;
    try {
      await clearAllHistory();
      setSessions([]);
      handleCreateSession();
      setActiveTab("landing");
    } catch (e) {
      console.error("Failed to clear history:", e);
    }
  };

  // Render view depending on active tab
  const renderMainContent = () => {
    switch (activeTab) {
      case "landing":
        return <LandingPage onStartChatting={() => setActiveTab("chat")} />;
      case "chat":
        return (
          <ChatPage
            sessionId={currentSessionId}
            sessionTitle={sessionTitle}
            messages={messages}
            settings={settings}
            onUpdateMessages={setMessages}
            onRefreshHistory={loadHistory}
          />
        );
      case "profile":
        return <ProfilePage />;
      case "progress":
        return <ProgressPage />;
      case "settings":
        return (
          <SettingsPage
            settings={settings}
            onUpdateSettings={setSettings}
            isDark={isDark}
            onToggleTheme={toggleTheme}
          />
        );
      case "admin":
        return <AdminPage />;
      default:
        return <LandingPage onStartChatting={() => setActiveTab("chat")} />;
    }
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden animated-mesh-bg text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300 relative">
      
      {/* Mobile Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer container */}
      <div className={`fixed inset-y-0 left-0 z-30 md:relative md:translate-x-0 transition-transform duration-300 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          activeTab={activeTab}
          isDark={isDark}
          onSelectSession={(id) => {
            handleSelectSession(id);
            setIsSidebarOpen(false);
          }}
          onCreateSession={() => {
            handleCreateSession();
            setIsSidebarOpen(false);
          }}
          onDeleteSession={handleDeleteSession}
          onClearHistory={handleClearHistory}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false);
          }}
          onToggleTheme={toggleTheme}
        />
      </div>

      {/* Main Content Pane */}
      <main className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-slate-800/40 glass z-10 flex-shrink-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 transition"
            title="Open Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm text-slate-800 dark:text-white">Lex AI Mentor</span>
          <div className="w-9 h-9" /> {/* Spacer to align title center */}
        </div>
        
        {renderMainContent()}
      </main>

    </div>
  );
}

export default App;
