"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  X,
  Sparkles,
  Key,
  Check,
  RefreshCw,
  Shield,
  BookOpen,
  GraduationCap,
  Lock,
  Unlock,
} from "lucide-react";
import type { UserRole, User as ErpUser, Notice } from "@/types/erp";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  mode?: "groq" | "offline";
}

function createBotMsgId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

export function CMSbot({
  currentUser,
  activeRole,
  notices = [],
}: {
  currentUser: ErpUser | null;
  activeRole: UserRole;
  notices?: Notice[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isKeyLocked, setIsKeyLocked] = useState(true);
  const [keyStatus, setKeyStatus] = useState<{
    hasEnvKey: boolean;
    hasCustomKey: boolean;
    hasActiveKey: boolean;
  }>({
    hasEnvKey: false,
    hasCustomKey: false,
    hasActiveKey: false,
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch backend API Key status on mount and role change
  useEffect(() => {
    fetch("/api/chat/status")
      .then((res) => res.json())
      .then((data) => {
        setKeyStatus(data);
        if (data.hasCustomKey) {
          const stored = localStorage.getItem("groq_admin_api_key") || "";
          setApiKeyInput(stored);
        }
      })
      .catch(() => {});
  }, [activeRole]);

  // Initial welcome message based on active role
  const [welcomeRoleKey, setWelcomeRoleKey] = useState("");
  const currentRoleKey = `${activeRole}-${currentUser?.name}-${keyStatus.hasActiveKey}`;

  if (welcomeRoleKey !== currentRoleKey) {
    setWelcomeRoleKey(currentRoleKey);
    const name = currentUser?.name || "there";
    let welcome = `Hi **${name}**! I am **CMSbot**. How can I help you today?`;
    if (activeRole === "student") {
      welcome = `Hi **${name}**! I am **CMSbot**. Ask me about your attendance %, fee dues, grades, or exam timetable.`;
    } else if (activeRole === "faculty") {
      welcome = `Welcome **Dr. ${name}**! I am **CMSbot**. Ask me about class attendance rates, exam marks, or leave reviews.`;
    } else if (activeRole === "admin") {
      welcome = `Greetings **Director ${name}**! I am **CMSbot**. Ask me about revenue metrics, student registers, or campus logs.`;
    }

    setMessages([
      {
        id: "msg-welcome",
        sender: "bot",
        text: welcome,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mode: keyStatus.hasActiveKey ? "groq" : "offline",
      },
    ]);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const saveAdminKeyHandler = () => {
    const trimmed = apiKeyInput.trim();
    if (trimmed) {
      localStorage.setItem("groq_admin_api_key", trimmed);
    } else {
      localStorage.removeItem("groq_admin_api_key");
    }
    setKeyStatus((prev) => ({
      ...prev,
      hasCustomKey: Boolean(trimmed),
      hasActiveKey: Boolean(trimmed) || prev.hasEnvKey,
    }));
    setIsKeyLocked(true);
    setShowSettings(false);
  };

  const resetToEnvKeyHandler = () => {
    localStorage.removeItem("groq_admin_api_key");
    setApiKeyInput("");
    setKeyStatus((prev) => ({
      ...prev,
      hasCustomKey: false,
      hasActiveKey: prev.hasEnvKey,
    }));
    setIsKeyLocked(true);
  };

  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: createBotMsgId("msg"),
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customMessage) setInput("");
    setLoading(true);

    try {
      const contextObj = {
        role: activeRole,
        userName: currentUser?.name,
        rollNoOrEmpId: currentUser?.rollNoOrEmpId,
        department: currentUser?.department,
        gpa: currentUser?.gpa,
        noticesCount: notices.length,
      };

      const storedAdminKey = activeRole === "admin" ? localStorage.getItem("groq_admin_api_key") || undefined : undefined;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          role: activeRole,
          apiKey: storedAdminKey,
          contextJson: JSON.stringify(contextObj),
        }),
      });

      const data = await response.json();
      const botMsg: Message = {
        id: createBotMsgId("bot"),
        sender: "bot",
        text: data.reply || "Sorry, I couldn't process that request right now.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mode: data.mode || (keyStatus.hasActiveKey ? "groq" : "offline"),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errMsg: Message = {
        id: createBotMsgId("bot-err"),
        sender: "bot",
        text: "Connected to local ERP engine. Ask me about attendance, fees, timetable, or grades!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mode: "offline",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedPrompts = (() => {
    if (activeRole === "student") {
      return ["Attendance %", "Fee dues", "GPA & grades", "Exam schedule"];
    }
    if (activeRole === "faculty") {
      return ["Class attendance", "Pending marks", "Leave requests", "Timetable"];
    }
    return ["Fee collections", "Student count", "Campus notices", "Faculty summary"];
  })();

  const RoleIcon = activeRole === "admin" ? Shield : activeRole === "faculty" ? BookOpen : GraduationCap;
  const isAdmin = activeRole === "admin";

  return (
    <>
      {/* Compact Floating Launcher Button */}
      <div className="fixed bottom-5 right-5 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open CMSbot AI Assistant"
            className="group relative w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg hover:shadow-xl hover:bg-blue-700 hover:scale-105 transition-all duration-200 flex items-center justify-center border border-blue-400/40"
          >
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white" />
            </span>
          </button>
        )}
      </div>

      {/* Sleek Compact Chat Window */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[360px] sm:w-[380px] max-w-[92vw] h-[480px] max-h-[82vh] bg-white rounded-2xl border border-slate-200/90 shadow-xl flex flex-col overflow-hidden pop-in">
          {/* Header Bar */}
          <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0 leading-tight">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display font-bold text-sm text-slate-900">CMSbot AI</h3>
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-full border border-slate-200">
                    <RoleIcon className="w-3 h-3 text-blue-600" />
                    <span className="capitalize">{activeRole}</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {keyStatus.hasActiveKey ? "Groq AI Active" : "Local Assistant"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* API Key settings is STRICTLY ADMIN-ONLY */}
              {isAdmin && (
                <button
                  onClick={() => setShowSettings((v) => !v)}
                  title="Admin Groq API Key Settings"
                  className={`p-1.5 rounded-lg transition-colors ${
                    showSettings ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Key className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                aria-label="Close CMSbot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Admin-Only Groq API Key Settings & Lock Drawer */}
          {isAdmin && showSettings && (
            <div className="bg-slate-900 text-white p-3.5 border-b border-slate-800 pop-in text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5 text-slate-200">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Admin API Key Control
                </span>
                <span className="text-[10px] text-blue-400 font-mono bg-blue-950 px-2 py-0.5 rounded-full border border-blue-800 flex items-center gap-1">
                  {isKeyLocked ? <Lock className="w-3 h-3 text-emerald-400" /> : <Unlock className="w-3 h-3 text-amber-400" />}
                  {isKeyLocked ? "Locked" : "Editable"}
                </span>
              </div>

              {isKeyLocked ? (
                <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
                    <span>Active Key:</span>
                    <span className="text-emerald-400 font-semibold">
                      {keyStatus.hasCustomKey
                        ? "gsk_•••••••• (Admin Override)"
                        : keyStatus.hasEnvKey
                        ? "gsk_•••••••• (Environment Default)"
                        : "No API Key Set"}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsKeyLocked(false)}
                    className="w-full bg-slate-700 hover:bg-blue-600 text-white font-semibold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Unlock className="w-3.5 h-3.5" /> Unlock to Change Key
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-slate-400 text-[11px]">
                    Paste custom Groq API Key (overrides system environment key):
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="gsk_..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <button
                      onClick={saveAdminKeyHandler}
                      className="bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
                  {keyStatus.hasCustomKey && (
                    <button
                      onClick={resetToEnvKeyHandler}
                      className="w-full text-slate-400 hover:text-white text-[11px] underline py-0.5 text-center"
                    >
                      Reset to System Environment Key
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <div key={m.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[85%] px-3.5 py-2 text-xs leading-relaxed ${
                      isUser
                        ? "bg-blue-600 text-white rounded-2xl rounded-tr-xs shadow-xs"
                        : "bg-white text-slate-800 border border-slate-200/80 rounded-2xl rounded-tl-xs shadow-xs"
                    }`}
                  >
                    {m.text.split("\n").map((line, idx) => (
                      <p key={idx} className={idx > 0 ? "mt-1" : ""}>
                        {line.split("**").map((part, pIdx) =>
                          pIdx % 2 === 1 ? <strong key={pIdx} className="font-semibold">{part}</strong> : part
                        )}
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-400 font-mono">
                    <span>{m.timestamp}</span>
                    {!isUser && (
                      <span className="text-slate-400 font-sans">
                        • {m.mode === "groq" ? "Groq" : "Local"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 bg-white text-slate-500 border border-slate-200 px-3 py-1.5 rounded-2xl rounded-tl-xs text-xs w-max shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Clean Prompt Chips - Flex Wrap */}
          <div className="p-2 bg-slate-50/60 border-t border-slate-100 flex flex-wrap gap-1.5">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-600 text-[11px] font-medium px-2.5 py-1 rounded-full border border-slate-200/80 transition-all shadow-xs"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask CMSbot...`}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs shrink-0"
              title="Send Message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
