import React, { useState, useEffect } from "react";
import { Award, BookOpen, Target, CheckCircle2, TrendingUp, HelpCircle } from "lucide-react";
import { ProgressStats, fetchProgress } from "../services/api";

export function ProgressPage() {
  const [data, setData] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const stats = await fetchProgress();
      setData(stats);
    } catch (e) {
      console.error("Failed to load progress stats:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-slate-50/50 dark:bg-slate-950/20">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading progress tracking metrics...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-slate-50/50 dark:bg-slate-950/20">
        <div className="text-center text-red-500 text-sm font-semibold">
          Error: Failed to fetch progress stats. Ensure backend is running.
        </div>
      </div>
    );
  }

  // Pre-configured Roadmap Modules
  const roadmapModules = [
    {
      title: "1. Python Programming Core",
      skills: ["Syntax & Types", "Control Flow & Loops", "Data Structures", "Functions & Modules"],
      status: data.skills.includes("Python") || data.completed_topics.includes("Python") ? "completed" : "active"
    },
    {
      title: "2. Full Stack Web Frameworks",
      skills: ["FastAPI REST Services", "React Templates", "Tailwind Stylings", "API Integrations"],
      status: data.completed_topics.includes("FastAPI") || data.current_topics.includes("FastAPI") ? "active" : "locked"
    },
    {
      title: "3. Large Language Models & RAG",
      skills: ["Ollama Models setup", "Vector databases (ChromaDB)", "Text Chunking Embeddings", "Context Ingestion"],
      status: data.current_topics.includes("Ollama") || data.completed_topics.includes("Ollama") ? "active" : "locked"
    },
    {
      title: "4. Web Scraping & Agent Tools",
      skills: ["Tavily API Crawler", "Context formatting", "Agent Tools Routing", "Online news integration"],
      status: "locked"
    },
    {
      title: "5. Quantum Computing & Security",
      skills: ["Qubits & Gates", "Quantum Key Distributions", "Cryptography Basics", "Cybersecurity firewalls"],
      status: "locked"
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto w-full">
      
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">Learning Roadmap</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Dashboard tracking goals completion, acquired skills, and curriculum maps.</p>
      </div>

      {/* Grid Cards Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Goals Set", val: data.stats.goals_count, icon: Target, bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
          { label: "Skills Logged", val: data.stats.skills_count, icon: Award, bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
          { label: "Completed Topics", val: data.stats.completed_count, icon: CheckCircle2, bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
          { label: "Active Topics", val: data.stats.current_count, icon: BookOpen, bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400" }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-4 shadow-sm flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{item.label}</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">{item.val}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Progress Tracker Progress bar */}
      <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 mb-8 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Overall Learning Progress</h3>
          </div>
          <span className="text-sm font-extrabold text-primary-600 dark:text-primary-400">{data.completed_percentage}% Completed</span>
        </div>
        
        {/* Progress Bar container */}
        <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-primary-600 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${data.completed_percentage}%` }}
          />
        </div>
      </div>

      {/* Grid: Roadmap Timeline vs. Lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Timeline Roadmap */}
        <div className="md:col-span-2 glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm">
          <h3 className="font-bold text-slate-950 dark:text-white text-sm mb-6">Structured Curriculum Roadmap</h3>
          
          <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3.5 flex flex-col gap-8">
            {roadmapModules.map((module, idx) => (
              <div key={idx} className="relative pl-7 group">
                
                {/* Timeline node dot */}
                <div className={`absolute -left-3 top-0.5 w-6 h-6 rounded-full border-4 flex items-center justify-center transition duration-300 ${
                  module.status === "completed" 
                    ? "bg-emerald-500 border-emerald-200 dark:border-emerald-950 text-white" 
                    : module.status === "active" 
                      ? "bg-primary-600 border-primary-200 dark:border-primary-950 text-white" 
                      : "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-900 text-slate-400"
                }`}>
                  <span className="text-[9px] font-bold">{idx + 1}</span>
                </div>

                {/* Card */}
                <div className={`p-4 rounded-2xl border transition duration-300 ${
                  module.status === "completed" 
                    ? "bg-emerald-500/5 border-emerald-500/20" 
                    : module.status === "active" 
                      ? "bg-primary-500/5 border-primary-500/25 shadow-md shadow-primary-500/5" 
                      : "bg-slate-100/30 dark:bg-slate-900/10 border-slate-200/20 dark:border-slate-800/20 opacity-60"
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">{module.title}</h4>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      module.status === "completed" 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                        : module.status === "active" 
                          ? "bg-primary-600/15 text-primary-600 dark:text-primary-400 animate-pulse" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}>
                      {module.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {module.skills.map((skill, sIdx) => (
                      <span 
                        key={sIdx} 
                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          module.status === "completed" 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                            : module.status === "active" 
                              ? "bg-primary-500/10 text-primary-600 dark:text-primary-400" 
                              : "bg-slate-100 dark:bg-slate-900 text-slate-400"
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Sidebar panels */}
        <div className="flex flex-col gap-6">
          
          {/* Active items */}
          <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3">Active Subjects</h3>
            <div className="flex flex-col gap-2">
              {data.current_topics.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No topics active.</span>
              ) : (
                data.current_topics.map((topic, idx) => (
                  <div key={idx} className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/10 text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                    <span className="truncate">{topic}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Completed milestones */}
          <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3">Completed Milestones</h3>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {data.completed_topics.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No topics completed yet.</span>
              ) : (
                data.completed_topics.map((topic, idx) => (
                  <div key={idx} className="px-3 py-2 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                    <span className="truncate">{topic}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
