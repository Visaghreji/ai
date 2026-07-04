import React, { useState } from "react";
import { Copy, Check, Volume2, VolumeX, Globe, FileText, Brain, RefreshCw } from "lucide-react";
import { Message, Source } from "../services/api";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onSpeak?: (text: string) => void;
  onStopSpeaking?: () => void;
  isSpeakingThis?: boolean;
}

export function ChatMessage({
  message,
  isStreaming = false,
  onRegenerate,
  onSpeak,
  onStopSpeaking,
  isSpeakingThis = false
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVoice = () => {
    if (isSpeakingThis && onStopSpeaking) {
      onStopSpeaking();
    } else if (onSpeak) {
      onSpeak(message.content);
    }
  };

  // Safe lightweight markdown parser
  const renderContent = (content: string) => {
    if (!content) return null;

    // Split by code blocks ```
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, idx) => {
      // Check if code block
      if (part.startsWith("```")) {
        const lines = part.split("\n");
        const header = lines[0].substring(3).trim() || "code";
        const code = lines.slice(1, -1).join("\n");

        return (
          <div key={idx} className="my-4 rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200/40 dark:border-slate-800/40">
              <span className="uppercase tracking-wider">{header}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  alert("Code copied to clipboard!");
                }}
                className="hover:text-primary-600 dark:hover:text-primary-400 transition"
              >
                Copy Code
              </button>
            </div>
            <pre className="bg-slate-950 p-4 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Inline formatting (bold, links, lists, code)
      const lines = part.split("\n");
      return lines.map((line, lIdx) => {
        let trimmed = line.trim();
        
        // Bullet list
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <li key={`${idx}-${lIdx}`} className="ml-5 list-disc my-1 text-slate-700 dark:text-slate-200">
              {parseInline(trimmed.substring(2))}
            </li>
          );
        }

        // Ordered list
        if (/^\d+\.\s/.test(trimmed)) {
          const num = trimmed.match(/^\d+/)?.[0] || "1";
          const text = trimmed.replace(/^\d+\.\s/, "");
          return (
            <li key={`${idx}-${lIdx}`} className="ml-5 list-decimal my-1 text-slate-700 dark:text-slate-200">
              {parseInline(text)}
            </li>
          );
        }

        // Headers
        if (trimmed.startsWith("### ")) {
          return <h4 key={`${idx}-${lIdx}`} className="text-sm font-bold text-slate-900 dark:text-white mt-4 mb-2">{parseInline(trimmed.substring(4))}</h4>;
        }
        if (trimmed.startsWith("## ")) {
          return <h3 key={`${idx}-${lIdx}`} className="text-base font-bold text-slate-950 dark:text-white mt-5 mb-2.5">{parseInline(trimmed.substring(3))}</h3>;
        }
        if (trimmed.startsWith("# ")) {
          return <h2 key={`${idx}-${lIdx}`} className="text-lg font-extrabold text-slate-950 dark:text-white mt-6 mb-3 border-b border-slate-200/50 dark:border-slate-800/50 pb-1">{parseInline(trimmed.substring(2))}</h2>;
        }

        // Standard line
        return line ? (
          <p key={`${idx}-${lIdx}`} className="my-2 leading-relaxed text-slate-700 dark:text-slate-200 break-words">
            {parseInline(line)}
          </p>
        ) : (
          <div key={`${idx}-${lIdx}`} className="h-2" />
        );
      });
    });
  };

  // Helper to parse bold (**text**), inline code (`code`), and links
  const parseInline = (text: string) => {
    // Bold Regex
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={pIdx} className="font-semibold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={pIdx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-pink-500 dark:text-pink-400 font-mono text-[11px] border border-slate-200/40 dark:border-slate-800/40">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith("[") && part.includes("](")) {
        const label = part.substring(1, part.indexOf("]("));
        const url = part.substring(part.indexOf("](") + 2, part.length - 1);
        return (
          <a key={pIdx} href={url} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-0.5">
            {label}
          </a>
        );
      }
      return part;
    });
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "web": return <Globe className="w-3 h-3 text-sky-500" />;
      case "file": return <FileText className="w-3 h-3 text-emerald-500" />;
      case "memory": return <Brain className="w-3 h-3 text-purple-500" />;
      default: return <FileText className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      <div 
        className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 transition-all duration-300 ${
          isUser 
            ? "bg-primary-600 text-white rounded-tr-none shadow-md shadow-primary-500/10" 
            : "glass rounded-tl-none border border-slate-200/60 dark:border-slate-800/40 shadow-sm"
        }`}
      >
        
        {/* Name / Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold tracking-wider uppercase opacity-60">
            {isUser ? "You" : "Lex Mentor"}
          </span>

          {!isUser && !isStreaming && (
            <div className="flex items-center gap-2">
              {onSpeak && (
                <button 
                  onClick={handleVoice} 
                  className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isSpeakingThis ? "text-primary-500" : "text-slate-400"}`}
                  title={isSpeakingThis ? "Stop Voice" : "Text to Speech"}
                >
                  {isSpeakingThis ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              )}
              <button 
                onClick={handleCopy} 
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                title="Copy Response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              {onRegenerate && (
                <button 
                  onClick={onRegenerate} 
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                  title="Regenerate"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content body */}
        <div className="text-sm select-text whitespace-pre-wrap">
          {isUser ? <p className="leading-relaxed">{message.content}</p> : renderContent(message.content)}
        </div>

        {/* Streaming Loading dots */}
        {isStreaming && !message.content && (
          <div className="typing-dots flex items-center justify-start h-5 text-primary-500">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}

        {/* RAG / Web sources display */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200/40 dark:border-slate-800/40">
            <h5 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Sources Used:</h5>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/20 dark:border-slate-800/20 text-xs text-slate-600 dark:text-slate-300 shadow-sm"
                >
                  {getSourceIcon(source.type)}
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary-500 dark:hover:text-primary-400 transition truncate max-w-[150px]">
                      {source.name}
                    </a>
                  ) : (
                    <span className="truncate max-w-[150px]">{source.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
