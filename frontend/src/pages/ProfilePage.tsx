import React, { useState, useEffect } from "react";
import { User, MapPin, Award, BookOpen, CheckCircle, Target, Plus, X, Save } from "lucide-react";
import { Profile, fetchProfile, saveProfile } from "../services/api";

export function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Temporary inputs for lists addition
  const [newGoal, setNewGoal] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [newCurrentTopic, setNewCurrentTopic] = useState("");
  const [newCompletedTopic, setNewCompletedTopic] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await fetchProfile();
      setProfile(data);
    } catch (e) {
      console.error("Failed to load profile:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setSaving(true);
      const success = await saveProfile(profile);
      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Failed to save profile:", e);
      alert("Error: Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const addListItem = (listName: "goals" | "skills" | "current_topics" | "completed_topics", value: string, setter: (val: string) => void) => {
    if (!profile || !value.trim()) return;
    setProfile({
      ...profile,
      [listName]: [...profile[listName], value.trim()]
    });
    setter("");
  };

  const removeListItem = (listName: "goals" | "skills" | "current_topics" | "completed_topics", idx: number) => {
    if (!profile) return;
    const list = [...profile[listName]];
    list.splice(idx, 1);
    setProfile({
      ...profile,
      [listName]: list
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-slate-50/50 dark:bg-slate-950/20">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Fetching profile details...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-slate-50/50 dark:bg-slate-950/20">
        <div className="text-center text-red-500 text-sm font-semibold">
          Error: Failed to fetch profile details. Ensure backend is running.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto w-full">
      
      {/* Title */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">Mentor Profile</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure parameters used to direct and personalize answers.</p>
        </div>
        {saveSuccess && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-fade-in shadow-sm">
            ✓ Changes updated successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        
        {/* Core Profile Card */}
        <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 flex flex-col md:flex-row gap-6 shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white flex items-center justify-center font-bold text-3xl shadow-lg flex-shrink-0">
            {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile({...profile, name: e.target.value})}
                required
                className="w-full bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-white focus:border-primary-500/40 outline-none transition"
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Nickname (Alias)</label>
              <input
                type="text"
                value={profile.nickname}
                onChange={e => setProfile({...profile, nickname: e.target.value})}
                required
                className="w-full bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-white focus:border-primary-500/40 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={profile.location}
                  onChange={e => setProfile({...profile, location: e.target.value})}
                  className="w-full bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-white focus:border-primary-500/40 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Age</label>
              <input
                type="number"
                value={profile.age || ""}
                onChange={e => setProfile({...profile, age: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-white focus:border-primary-500/40 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Lists Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Goals */}
          <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-primary-600" />
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Learning Goals</h3>
            </div>
            
            {/* Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add goal (e.g. Master quantum computing)"
                value={newGoal}
                onChange={e => setNewGoal(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addListItem("goals", newGoal, setNewGoal))}
                className="flex-1 bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
              />
              <button
                type="button"
                onClick={() => addListItem("goals", newGoal, setNewGoal)}
                className="p-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white transition flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {profile.goals.length === 0 ? (
                <span className="text-[11px] text-slate-400 italic">No goals defined.</span>
              ) : (
                profile.goals.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-100/60 dark:bg-slate-900/40 px-3.5 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                    <span className="truncate pr-2">{item}</span>
                    <button type="button" onClick={() => removeListItem("goals", idx)} className="text-slate-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Skills */}
          <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-emerald-650" />
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Core Skills</h3>
            </div>
            
            {/* Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add skill (e.g. JavaScript, Python)"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addListItem("skills", newSkill, setNewSkill))}
                className="flex-1 bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
              />
              <button
                type="button"
                onClick={() => addListItem("skills", newSkill, setNewSkill)}
                className="p-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white transition flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {profile.skills.length === 0 ? (
                <span className="text-[11px] text-slate-400 italic">No skills defined.</span>
              ) : (
                profile.skills.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <span>{item}</span>
                    <button type="button" onClick={() => removeListItem("skills", idx)} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Current Learning Topics */}
          <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-sky-600" />
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Current Topics</h3>
            </div>
            
            {/* Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add current topic (e.g. FastAPI, RAG)"
                value={newCurrentTopic}
                onChange={e => setNewCurrentTopic(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addListItem("current_topics", newCurrentTopic, setNewCurrentTopic))}
                className="flex-1 bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
              />
              <button
                type="button"
                onClick={() => addListItem("current_topics", newCurrentTopic, setNewCurrentTopic)}
                className="p-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white transition flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {profile.current_topics.length === 0 ? (
                <span className="text-[11px] text-slate-400 italic">No active topics.</span>
              ) : (
                profile.current_topics.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-100/60 dark:bg-slate-900/40 px-3.5 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                    <span className="truncate pr-2">{item}</span>
                    <button type="button" onClick={() => removeListItem("current_topics", idx)} className="text-slate-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Completed Topics */}
          <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-emerald-650" />
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Completed Topics</h3>
            </div>
            
            {/* Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add completed topic (e.g. Python Basics)"
                value={newCompletedTopic}
                onChange={e => setNewCompletedTopic(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addListItem("completed_topics", newCompletedTopic, setNewCompletedTopic))}
                className="flex-1 bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
              />
              <button
                type="button"
                onClick={() => addListItem("completed_topics", newCompletedTopic, setNewCompletedTopic)}
                className="p-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white transition flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {profile.completed_topics.length === 0 ? (
                <span className="text-[11px] text-slate-400 italic">No topics marked as complete yet.</span>
              ) : (
                profile.completed_topics.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 px-3.5 py-2 rounded-xl text-xs text-slate-700 dark:text-emerald-400 font-semibold">
                    <span className="truncate pr-2">{item}</span>
                    <button type="button" onClick={() => removeListItem("completed_topics", idx)} className="text-slate-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Submit */}
        <div className="flex justify-end mt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Updating..." : "Save Config Profile"}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
