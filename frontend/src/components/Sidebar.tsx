import React, { useState } from "react";
import { 
  MessageSquare, Plus, Search, Trash2, User, BarChart2, 
  Settings as SettingsIcon, ShieldAlert, Home, Sun, Moon 
} from "lucide-react";
import { ChatSession } from "../services/api";

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  activeTab: string;
  isDark: boolean;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onClearHistory: () => void;
  onTabChange: (tab: string) => void;
  onToggleTheme: () => void;
}

export function Sidebar({
  sessions,
  currentSessionId,
  activeTab,
  isDark,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onClearHistory,
  onTabChange,
  onToggleTheme
}: SidebarProps) {
  const [search, setSearch] = useState("");

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { id: "landing", label: "Home", icon: Home },
    { id: "chat", label: "Chat Workspace", icon: MessageSquare },
    { id: "profile", label: "Mentor Profile", icon: User },
    { id: "progress", label: "Learning Roadmap", icon: BarChart2 },
    { id: "settings", label: "Settings", icon: SettingsIcon },
    { id: "admin", label: "Admin Panel", icon: ShieldAlert },
  ];

  return (
    <aside className="w-80 h-auto md:h-screen border-r border-slate-200/50 dark:border-slate-800/40 glass flex flex-col justify-between flex-shrink-0 z-10 transition-all duration-300 overflow-y-visible md:overflow-y-hidden">
      
      {/* Top Brand & Actions */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div 
            onClick={() => onTabChange("landing")} 
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-violet-400 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary-500/20">
              L
            </div>
            <div>
              <h1 className="font-bold text-slate-800 dark:text-white leading-none text-base">Lex AI</h1>
              <span className="text-[10px] text-primary-500 font-semibold tracking-wider uppercase">Mentor</span>
            </div>
          </div>
          
          <button 
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <button 
          onClick={() => {
            onCreateSession();
            onTabChange("chat");
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/35 transition duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>New Session</span>
        </button>
      </div>

      {/* Navigation tabs */}
      <div className="px-3 py-1 flex flex-col gap-1 border-b border-slate-200/40 dark:border-slate-800/20">
        {tabs.slice(0, 3).map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                isActive 
                  ? "bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-900/40"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search and Chat Sessions list */}
      <div className="flex-1 flex flex-col min-h-0 py-3">
        <div className="px-4 mb-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search chat sessions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-100/80 dark:bg-slate-900/60 border border-transparent focus:border-primary-500/30 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none transition"
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-visible md:overflow-y-auto px-2 flex flex-col gap-1">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
              No conversations found
            </div>
          ) : (
            filteredSessions.map(session => {
              const isSelected = activeTab === "chat" && currentSessionId === session.id;
              return (
                <div
                  key={session.id}
                  className={`group relative flex items-center rounded-xl transition ${
                    isSelected 
                      ? "bg-slate-200/50 dark:bg-slate-900/60 text-slate-900 dark:text-white" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-900/30"
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectSession(session.id);
                      onTabChange("chat");
                    }}
                    className="flex-1 flex items-center gap-3.5 px-3.5 py-2.5 min-w-0 text-left text-xs font-medium"
                  >
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-primary-500" : ""}`} />
                    <span className="truncate pr-4">{session.title}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
                    title="Delete Conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom tabs & Clear action */}
      <div className="p-2 border-t border-slate-200/40 dark:border-slate-800/20 flex flex-col gap-1 bg-slate-50/20 dark:bg-slate-950/20">
        {tabs.slice(3).map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                isActive 
                  ? "bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-900/40"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}

        {sessions.length > 0 && (
          <button
            onClick={onClearHistory}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition mt-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chats</span>
          </button>
        )}
      </div>

    </aside>
  );
}
