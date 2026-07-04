import React, { useState, useEffect, useRef } from "react";
import {
  ShieldAlert,
  Radio,
  RefreshCw,
  Upload,
  Database,
  Search,
  FileJson,
  MessageSquare,
  Terminal,
  AlertCircle,
} from "lucide-react";
import {
  OllamaStatus,
  uploadFile,
  rebuildDatabase,
  checkOllama,
  testSearch,
  fetchAdminChats,
  fetchAdminMemory,
  fetchAdminProgress,
} from "../services/api";

export function AdminPage() {
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Knowledge management
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildMsg, setRebuildMsg] = useState("");

  // Search Tester
  const [testQuery, setTestQuery] = useState("");
  const [searchTesting, setSearchTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  // Raw Files Viewer
  const [activeJsonTab, setActiveJsonTab] = useState<
    "memory" | "progress" | "chats"
  >("memory");
  const [jsonContent, setJsonContent] = useState<string>("");
  const [loadingJson, setLoadingJson] = useState(false);

  useEffect(() => {
    runHealthCheck();
    loadJsonData(activeJsonTab);
  }, [activeJsonTab]);

  const runHealthCheck = async () => {
    try {
      setCheckingStatus(true);
      const status = await checkOllama();
      setOllamaStatus(status);
    } catch (e) {
      setOllamaStatus({
        online: false,
        models: [],
        has_lex_model: false,
        message: "Network Error: Failed to ping local Ollama host.",
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const loadJsonData = async (tab: "memory" | "progress" | "chats") => {
    try {
      setLoadingJson(true);
      let res;
      if (tab === "memory") res = await fetchAdminMemory();
      else if (tab === "progress") res = await fetchAdminProgress();
      else res = await fetchAdminChats();
      setJsonContent(JSON.stringify(res, null, 2));
    } catch (e) {
      setJsonContent(`Error loading data: ${e}`);
    } finally {
      setLoadingJson(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      setUploading(true);
      setUploadMsg("Uploading file and processing embeddings...");
      const res = await uploadFile(file);
      if (res.success) {
        setUploadMsg(
          `✓ Successfully uploaded ${file.name}. Added ${res.chunks_added || 0} chunks to ChromaDB.`,
        );
        // Reload raw json tab if chats is active
        loadJsonData(activeJsonTab);
      }
    } catch (error: any) {
      setUploadMsg(`Error: ${error.message || "Failed to process document."}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRebuild = async () => {
    if (
      !confirm(
        "Are you sure you want to rebuild ChromaDB? This will wipe the current index and parse all files inside 'knowledge' directory.",
      )
    )
      return;
    try {
      setRebuilding(true);
      setRebuildMsg("Deleting collection, reading files, and re-indexing...");
      const res = await rebuildDatabase();
      if (res.success) {
        setRebuildMsg(
          `✓ Database Rebuilt successfully. Ingested ${res.total_files} files, generating ${res.total_chunks} embeddings.`,
        );
      }
    } catch (e: any) {
      setRebuildMsg(`Error: ${e.message || "Rebuild failed."}`);
    } finally {
      setRebuilding(false);
    }
  };

  const handleTestSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;

    try {
      setSearchTesting(true);
      setTestResults(null);
      const res = await testSearch(testQuery);
      setTestResults(res);
    } catch (e: any) {
      setTestResults({ error: e.message || "Search query failed." });
    } finally {
      setSearchTesting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto w-full">
      {/* Title */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-rose-500" />
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor model health, manage knowledge base embeddings, and debug
            configurations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Status indicator Card */}
        <div className="md:col-span-2 glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Radio className="w-4.5 h-4.5 text-primary-600" />
                <span>Ollama Health status</span>
              </h3>
              <button
                onClick={runHealthCheck}
                disabled={checkingStatus}
                title="Refresh Ollama status"
                aria-label="Refresh Ollama status"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 transition disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${checkingStatus ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            {ollamaStatus ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${ollamaStatus.online ? "bg-emerald-500" : "bg-red-500"}`}
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Ollama Node: {ollamaStatus.online ? "Online" : "Offline"}
                  </span>
                </div>

                {ollamaStatus.online && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${ollamaStatus.has_lex_model ? "bg-emerald-500" : "bg-red-500"}`}
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Model 'lex':{" "}
                      {ollamaStatus.has_lex_model
                        ? "Found (Ready)"
                        : "Missing (Please build custom model)"}
                    </span>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/20 dark:border-slate-800/20 leading-relaxed font-mono">
                  {ollamaStatus.message}
                </p>
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">
                No health check executed.
              </span>
            )}
          </div>

          {ollamaStatus &&
            ollamaStatus.online &&
            ollamaStatus.models.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200/20 dark:border-slate-800/20">
                <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">
                  Available Local Models:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ollamaStatus.models.map((m, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/20 dark:border-slate-800/20"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Database & RAG Actions Card */}
        <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 mb-3">
              <Database className="w-4.5 h-4.5 text-emerald-600" />
              <span>ChromaDB Indexing</span>
            </h3>

            {/* Upload form */}
            <div className="flex flex-col gap-2 mb-4">
              <input
                type="file"
                aria-label="Upload knowledge file"
                title="Upload knowledge file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.pdf,.docx"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-2 px-3 border border-dashed border-slate-200/60 dark:border-slate-800/60 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/40 transition"
              >
                <Upload className="w-4 h-4 text-primary-500" />
                <span>
                  {uploading ? "Ingesting..." : "Upload Knowledge File"}
                </span>
              </button>
              {uploadMsg && (
                <div className="text-[10px] bg-slate-100/50 dark:bg-slate-900/50 p-2 rounded-xl text-slate-500 font-medium leading-relaxed">
                  {uploadMsg}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleRebuild}
            disabled={rebuilding}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{rebuilding ? "Reindexing..." : "Rebuild Database"}</span>
          </button>
          {rebuildMsg && (
            <div className="text-[10px] mt-2 text-emerald-600 dark:text-emerald-400 font-semibold text-center leading-normal">
              {rebuildMsg}
            </div>
          )}
        </div>
      </div>

      {/* Grid: JSON Store Viewer vs. Web search Tester */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Raw Files Viewer */}
        <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5 shadow-sm flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-4 border-b border-slate-200/20 dark:border-slate-800/20 pb-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <FileJson className="w-4.5 h-4.5 text-purple-600" />
              <span>JSON Stores Auditor</span>
            </h3>

            <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200/20 dark:border-slate-800">
              {(["memory", "progress", "chats"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveJsonTab(tab)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md capitalize transition ${
                    activeJsonTab === tab
                      ? "bg-white dark:bg-slate-800 shadow-sm text-primary-600 dark:text-primary-400"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
                >
                  {tab === "chats" ? "Chats Log" : `${tab}.json`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-slate-950 rounded-xl overflow-hidden relative border border-slate-900">
            {loadingJson ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
                Formatting dump...
              </div>
            ) : (
              <textarea
                aria-label="JSON store content"
                value={jsonContent}
                readOnly
                className="w-full h-full p-4 bg-transparent text-emerald-400 font-mono text-xs border-none outline-none resize-none overflow-auto leading-relaxed select-text"
              />
            )}
          </div>
        </div>

        {/* Web Search Tester */}
        <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5 shadow-sm flex flex-col h-[500px]">
          <div className="mb-4 border-b border-slate-200/20 dark:border-slate-800/20 pb-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Search className="w-4.5 h-4.5 text-sky-600" />
              <span>Tavily Crawler auditor</span>
            </h3>
          </div>

          <form onSubmit={handleTestSearch} className="flex gap-2 mb-4">
            <label htmlFor="admin-search-query" className="sr-only">
              Tavern search query
            </label>
            <input
              id="admin-search-query"
              type="text"
              placeholder="Test query (e.g. Weather in Bangalore today)"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              className="flex-1 bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white outline-none"
            />
            <button
              type="submit"
              disabled={searchTesting || !testQuery.trim()}
              className="px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs transition"
            >
              Search
            </button>
          </form>

          <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl p-4 overflow-y-auto text-xs font-mono">
            {searchTesting ? (
              <div className="text-slate-500 animate-pulse flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span>Pinging Tavily REST API...</span>
              </div>
            ) : testResults ? (
              testResults.error ? (
                <div className="text-rose-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{testResults.error}</span>
                </div>
              ) : (
                <div className="text-slate-300 select-text leading-relaxed">
                  <h4 className="font-bold text-emerald-400 mb-2">
                    // Web results fetched:
                  </h4>
                  {testResults.sources && testResults.sources.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {testResults.sources.map((s: any, idx: number) => (
                        <div
                          key={idx}
                          className="border-b border-slate-900 pb-2"
                        >
                          <span className="block text-emerald-500 font-bold">
                            [{idx + 1}] {s.name}
                          </span>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-500 hover:underline text-[10px]"
                          >
                            {s.url}
                          </a>
                        </div>
                      ))}
                      <span className="block text-emerald-400 mt-4">
                        // Formatted Context passed to LLM:
                      </span>
                      <pre className="whitespace-pre-wrap text-[10px] text-slate-400 bg-slate-900/40 p-2.5 rounded-lg border border-slate-900">
                        {testResults.context}
                      </pre>
                    </div>
                  ) : (
                    <span className="italic text-slate-500">
                      No content matches query or API key missing.
                    </span>
                  )}
                </div>
              )
            ) : (
              <div className="text-slate-500 italic flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span>Awaiting search queries...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
