"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { characters, getCharacter } from "@/data/characters";
import { getMenusByCharacter, getMenu } from "@/data/menus";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatConversation {
  id: string;
  characterId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

const STORAGE_KEY = "jarvis-conversations";
const ADMIN_CONFIG_KEY = "jarvis-admin-config";

function genId() {
  return Math.random().toString(36).slice(2, 11);
}

// ===== Loading fallback =====
function ChatLoading() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">読み込み中...</span>
      </div>
    </div>
  );
}

// ===== Main chat component =====
function ChatContent() {
  const searchParams = useSearchParams();
  const initCharParam = searchParams.get("character");
  const initMenuId = searchParams.get("menu");
  const initCharId = initCharParam ?? "jin";

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [selectedCharId, setSelectedCharId] = useState(initCharId);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [adminConfig, setAdminConfig] = useState<Record<string, boolean>>({});
  const [storageLoaded, setStorageLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const didAutoSend = useRef(false);
  // Always holds the latest sendMessage to avoid stale closures in effects
  const sendMsgRef = useRef<((text: string) => Promise<void>) | null>(null);

  // ── Load localStorage ──────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const convs = JSON.parse(stored) as ChatConversation[];
        setConversations(convs);
        // Restore last session only when NOT navigating from a menu card
        if (!initCharParam && !initMenuId && convs.length > 0) {
          setActiveConvId(convs[0].id);
          setSelectedCharId(convs[0].characterId);
        }
      }
      const adminStored = localStorage.getItem(ADMIN_CONFIG_KEY);
      if (adminStored) setAdminConfig(JSON.parse(adminStored));
    } catch {}
    setStorageLoaded(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist conversations ─────────────────────────────────────────────────
  useEffect(() => {
    if (!storageLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, 50)));
    } catch {}
  }, [conversations, storageLoaded]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, isLoading]);

  // ── Auto-resize textarea ──────────────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [inputText]);

  // ── Auto-send from URL ?menu= param ──────────────────────────────────────
  useEffect(() => {
    if (!storageLoaded || !initMenuId || didAutoSend.current) return;
    const menu = getMenu(initMenuId);
    if (!menu) return;
    didAutoSend.current = true;
    const timer = setTimeout(() => {
      sendMsgRef.current?.(menu.title + "をお願いします");
    }, 150);
    return () => clearTimeout(timer);
  }, [storageLoaded, initMenuId]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const activeConversation = conversations.find((c) => c.id === activeConvId) ?? null;
  const messages = activeConversation?.messages ?? [];
  const activeCharId = activeConversation?.characterId ?? selectedCharId;
  const selectedChar = getCharacter(activeCharId) ?? characters[0];
  const enabledMenus = getMenusByCharacter(activeCharId).filter(
    (m) => adminConfig[m.id] !== false
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleNewChat = () => {
    setActiveConvId(null); // Show greeting without creating a conversation
  };

  const handleSelectCharacter = (charId: string) => {
    setSelectedCharId(charId);
    setActiveConvId(null); // Just show the greeting for this character
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const trimmed = text.trim();
    setInputText("");

    // Create conversation only now (first message)
    let convId = activeConvId;
    let convCharId = activeCharId;

    if (!convId) {
      const conv: ChatConversation = {
        id: genId(),
        characterId: selectedCharId,
        title: "",
        messages: [],
        createdAt: Date.now(),
      };
      convId = conv.id;
      convCharId = selectedCharId;
      setActiveConvId(convId);
      setConversations((prev) => [conv, ...prev]);
    }

    // Capture messages before state update
    const currentMsgs = activeConversation?.messages ?? [];
    const userMsg: ChatMessage = {
      id: genId(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };
    const allMessages = [...currentMsgs, userMsg];

    // Add user message to conversation
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        return {
          ...c,
          title: c.title || trimmed.slice(0, 30),
          messages: [...c.messages, userMsg],
        };
      })
    );

    // Show spinner, fetch full response
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: convCharId,
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error("API error");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");

      // Collect all chunks silently (no intermediate display)
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }

      // Show full response at once
      const aiMsg: ChatMessage = {
        id: genId(),
        role: "assistant",
        content: accumulated,
        timestamp: Date.now(),
      };
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          return { ...c, messages: [...c.messages, aiMsg] };
        })
      );
    } catch {
      const errMsg: ChatMessage = {
        id: genId(),
        role: "assistant",
        content: "エラーが発生しました。もう一度お試しください。",
        timestamp: Date.now(),
      };
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          return { ...c, messages: [...c.messages, errMsg] };
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Keep ref pointing to latest sendMessage
  sendMsgRef.current = sendMessage;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Logo + New Chat */}
        <div className="p-4 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-1 mb-3">
            {["J", "A", "R", "V", "I", "S"].map((letter, i) => {
              const colors = [
                "bg-orange-500", "bg-blue-500", "bg-purple-500",
                "bg-teal-500", "bg-rose-500", "bg-amber-500",
              ];
              return (
                <div
                  key={letter}
                  className={`w-5 h-5 ${colors[i]} rounded flex items-center justify-center text-white font-black text-xs`}
                >
                  {letter}
                </div>
              );
            })}
            <span className="font-black text-sm text-gray-800 ml-1">BOT</span>
          </Link>
          <button
            onClick={handleNewChat}
            className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors"
          >
            + NEW CHAT
          </button>
        </div>

        {/* Conversation list */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {conversations.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
              会話履歴がありません
              <br />
              NEW CHATから始めましょう
            </p>
          ) : (
            conversations.map((conv) => {
              const char = getCharacter(conv.characterId);
              const isActive = conv.id === activeConvId;
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setSelectedCharId(conv.characterId);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors mb-0.5 ${
                    isActive
                      ? `${char?.lightColor ?? "bg-blue-50"} ${char?.textColor ?? "text-blue-600"} font-bold`
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="truncate">
                    {conv.title || (
                      <span className="text-gray-400 italic text-xs">新しいチャット</span>
                    )}
                  </div>
                  <div className="text-xs opacity-50 mt-0.5 font-normal">
                    {char?.name} · {char?.department}
                  </div>
                </button>
              );
            })
          )}
        </nav>

        {/* Admin link */}
        <div className="p-4 border-t border-gray-100">
          <Link
            href="/admin"
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
            管理者設定
          </Link>
        </div>
      </aside>

      {/* ── Main area ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Character tabs */}
        <div className="bg-white border-b border-gray-200 flex flex-shrink-0 overflow-x-auto">
          {characters.map((char) => {
            const isActive = char.id === activeCharId;
            return (
              <button
                key={char.id}
                onClick={() => handleSelectCharacter(char.id)}
                className={`flex flex-col items-center px-4 py-3 border-b-2 transition-all flex-shrink-0 min-w-[72px] ${
                  isActive
                    ? `border-blue-500 ${char.textColor}`
                    : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`rounded-full overflow-hidden transition-all ${
                    isActive ? "ring-2 ring-blue-400 ring-offset-1" : ""
                  }`}
                >
                  <Image
                    src={`/avatars/${char.id}.svg`}
                    alt={char.name}
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                </div>
                <div className="text-xs font-bold mt-1 leading-none">{char.name}</div>
                <div className="text-xs opacity-60 mt-0.5 leading-none">{char.department}</div>
              </button>
            );
          })}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Greeting (when no messages in active conversation) */}
          {messages.length === 0 && !isLoading && (
            <div className="flex gap-3 items-start max-w-2xl">
              <div className="flex-shrink-0 mt-1">
                <Image
                  src={`/avatars/${activeCharId}.svg`}
                  alt={selectedChar.name}
                  width={44}
                  height={44}
                  className="rounded-full shadow-sm"
                />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 p-4 flex-1">
                <p className="text-sm font-bold text-gray-800 mb-1">
                  こんにちは！{selectedChar.department}AI社員の{selectedChar.name}です！！
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  💬 「{selectedChar.greeting}」
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  お手伝いできることを選んでください
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => sendMessage("何でも相談に乗ってください")}
                    className={`px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all hover:opacity-70 active:scale-95 ${selectedChar.borderColor} ${selectedChar.textColor} ${selectedChar.lightColor}`}
                  >
                    💬 通常質問
                  </button>
                  {enabledMenus.map((menu) => (
                    <button
                      key={menu.id}
                      onClick={() => sendMessage(menu.title + "をお願いします")}
                      className={`px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all hover:opacity-70 active:scale-95 ${selectedChar.borderColor} ${selectedChar.textColor} ${selectedChar.lightColor}`}
                    >
                      {menu.icon} {menu.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 items-end ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 mb-1">
                  <Image
                    src={`/avatars/${activeCharId}.svg`}
                    alt="AI"
                    width={34}
                    height={34}
                    className="rounded-full shadow-sm"
                  />
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-3 text-sm max-w-lg lg:max-w-2xl ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white rounded-br-sm shadow-sm"
                    : "bg-white rounded-bl-sm shadow-sm border border-gray-100"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:mt-3 prose-headings:mb-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Thinking spinner (くるくる) */}
          {isLoading && (
            <div className="flex gap-3 items-end">
              <div className="flex-shrink-0 mb-1">
                <Image
                  src={`/avatars/${activeCharId}.svg`}
                  alt="AI"
                  width={34}
                  height={34}
                  className="rounded-full shadow-sm"
                />
              </div>
              <div className="bg-white rounded-2xl rounded-bl-sm shadow-sm border border-gray-100 px-4 py-3 flex items-center gap-2.5">
                <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin flex-shrink-0" />
                <span className="text-sm text-gray-400">考え中...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <button
              className="text-gray-300 hover:text-gray-500 p-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
              title="ファイル添付（近日対応）"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(inputText);
                }
              }}
              placeholder="メッセージを入力...（Shift+Enterで改行）"
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50 disabled:bg-gray-50"
              style={{ maxHeight: "120px", overflow: "hidden" }}
            />
            <button
              onClick={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
              className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-colors flex-shrink-0"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ===== Page export with Suspense =====
export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatContent />
    </Suspense>
  );
}
