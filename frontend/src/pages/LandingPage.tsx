import React from "react";
import { MessageSquare, Brain, FolderOpen, Globe, BarChart3, GraduationCap } from "lucide-react";

interface LandingPageProps {
  onStartChatting: () => void;
}

export function LandingPage({ onStartChatting }: LandingPageProps) {
  const features = [
    {
      title: "Interactive AI Mentor",
      desc: "Get explanations simplified with real-world examples, tailored practical exercise challenges, and custom explanations suited to your learning level.",
      icon: GraduationCap,
      color: "from-purple-500 to-indigo-500"
    },
    {
      title: "Active Memory System",
      desc: "Lex remembers your interests, name, nickname, current projects, and preferences, adapting the dialogue structure organically over time.",
      icon: Brain,
      color: "from-pink-500 to-rose-500"
    },
    {
      title: "Integrated Knowledge Base",
      desc: "Upload local textbooks, PDF reports, or text guides. Lex runs ChromaDB embeddings searches internally to reference matching files in responses.",
      icon: FolderOpen,
      color: "from-emerald-500 to-teal-500"
    },
    {
      title: "Tavily Web Search",
      desc: "Toggle live web crawling. If you ask about current events, Lex searches Tavily in real time, citing URLs and fresh news articles.",
      icon: Globe,
      color: "from-sky-500 to-blue-500"
    },
    {
      title: "Learning Progress Tracking",
      desc: "Set study goals and log topics as you master them. Monitor statistics cards and view interactive roadmaps detailing your learning journey.",
      icon: BarChart3,
      color: "from-amber-500 to-orange-500"
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start min-h-screen relative p-6 animated-mesh-bg transition-colors duration-500">
      
      {/* Hero Header */}
      <div className="max-w-4xl text-center mt-16 md:mt-24 mb-12 flex flex-col items-center gap-6">
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-slate-200/40 dark:border-slate-800/40 text-xs font-semibold text-primary-600 dark:text-primary-400 shadow-sm animate-pulse">
          <Brain className="w-3.5 h-3.5" />
          <span>Local Localized AI Mentor Model</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight select-none">
          Accelerate Your Learning with <span className="bg-gradient-to-r from-primary-600 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">Lex AI</span>
        </h1>

        <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          Your personal local mentor model built on top of local Ollama nodes. Upload files, enable web access, set learning goals, and watch your skills grow.
        </p>

        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            onClick={onStartChatting}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-500 hover:to-violet-500 text-white font-bold text-base shadow-lg shadow-primary-500/25 hover:shadow-primary-500/35 transform hover:-translate-y-0.5 active:translate-y-0 transition duration-200 flex items-center gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Start Learning Session</span>
          </button>
        </div>
      </div>

      {/* Feature Grids */}
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24 mt-4">
        {features.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div 
              key={idx} 
              className="glass-card hover:bg-white/80 dark:hover:bg-slate-800/80 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-start gap-4 hover:shadow-xl hover:-translate-y-1 transition duration-300 group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white shadow-md transform group-hover:scale-110 transition duration-300`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="w-full text-center py-6 border-t border-slate-200/20 dark:border-slate-800/10 text-xs text-slate-400 dark:text-slate-500 mt-auto">
        Lex AI Mentor System • Powered by FastAPI & ChromaDB Local Nodes
      </div>

    </div>
  );
}
