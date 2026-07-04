import React from "react";
import { Settings as SettingsIcon, Shield, Search, Brain, Moon, Sun } from "lucide-react";
import { Settings } from "../services/api";

interface SettingsPageProps {
  settings: Settings;
  onUpdateSettings: (updater: (prev: Settings) => Settings) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function SettingsPage({
  settings,
  onUpdateSettings,
  isDark,
  onToggleTheme
}: SettingsPageProps) {
  
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modelName = e.target.value;
    onUpdateSettings(prev => ({ ...prev, modelName }));
  };

  const handleToggleSearch = () => {
    onUpdateSettings(prev => ({ ...prev, enableWebSearch: !prev.enableWebSearch }));
  };

  const handleToggleMemory = () => {
    onUpdateSettings(prev => ({ ...prev, enableMemory: !prev.enableMemory }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-3xl mx-auto w-full">
      
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-primary-600" />
          <span>System Settings</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure Ollama model bindings, browser parameters, and crawler access toggles.</p>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Model Selection Card */}
        <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Local AI Model Binding</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Specify the model to communicate with on your local Ollama port.</p>
          </div>
          
          <select
            value={settings.modelName}
            onChange={handleModelChange}
            className="w-full bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white focus:border-primary-500/40 outline-none transition cursor-pointer"
          >
            <option value="lex">lex (Custom Prompt Model - Recommended)</option>
            <option value="qwen2.5:1.5b">qwen2.5:1.5b</option>
            <option value="llama3">llama3</option>
            <option value="mistral">mistral</option>
          </select>
          <span className="text-[10px] text-slate-400">Note: Ensure you have built/pulled the selected model inside your Ollama environment.</span>
        </div>

        {/* Feature Toggles Card */}
        <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm flex flex-col gap-5">
          
          <h3 className="font-bold text-slate-900 dark:text-white text-sm border-b border-slate-200/20 dark:border-slate-800/20 pb-2">Operational Features</h3>

          {/* Web Search */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4 items-start">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Search className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Live Web Crawling</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mt-0.5">Allow Lex to perform Tavily searches if queries trigger current event tags (Weather, news, matches, etc).</p>
              </div>
            </div>
            
            <button
              onClick={handleToggleSearch}
              className={`w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none flex items-center p-0.5 ${
                settings.enableWebSearch ? "bg-primary-600 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          {/* Memory */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4 items-start">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Brain className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Interactive Memory Routing</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mt-0.5">Use custom keyword matching to route questions (Memory, RAG, Web) to feed tailored settings to the prompt constructor.</p>
              </div>
            </div>
            
            <button
              onClick={handleToggleMemory}
              className={`w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none flex items-center p-0.5 ${
                settings.enableMemory ? "bg-primary-600 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          {/* Dark Mode Theme */}
          <div className="flex items-center justify-between border-t border-slate-200/20 dark:border-slate-800/20 pt-4">
            <div className="flex gap-4 items-start">
              <div className="w-9 h-9 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                {isDark ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Dark Interface Theme</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mt-0.5">Switch UI components to dark or light themes depending on lighting preferences.</p>
              </div>
            </div>
            
            <button
              onClick={onToggleTheme}
              className={`w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none flex items-center p-0.5 ${
                isDark ? "bg-primary-600 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
