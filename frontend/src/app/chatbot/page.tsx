"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { MessageSquare, Plus, Menu, User, Bot, Send, Mic, Paperclip, X, Image as ImageIcon, FileText, Camera, Moon, Sun, Volume2, Square, Globe, Pencil, MoreVertical, Trash2, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "@/components/ThemeProvider";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Session {
  chat_id: string;
  title: string | null;
  message_count: number;
  last_active: string;
}

export default function ChatbotPage() {
  const { isDarkMode } = useTheme();
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [isMicOpen, setIsMicOpen] = useState(false);

  // --- Real-time Chat State ---
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I am ArogyAI, your AI-Driven Public Health Chatbot. You can ask me questions about diseases, symptoms, or preventive healthcare. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const [language, setLanguage] = useState("english");

  // --- Session Editing State ---
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const router = useRouter();

  // --- Auth Interceptor ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  // Helper to get token safely (prevents Next.js SSR ReferenceError)
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || "";
    }
    return "";
  };

  const generateNewChatId = () => `session-${Date.now()}`;

  const fetchSessions = async () => {
    try {
      const res = await fetch("http://localhost:8000/sessions", {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    }
  };

  useEffect(() => {
    if (!currentChatId) setCurrentChatId(generateNewChatId());
    fetchSessions();
  }, []);

  const loadChat = async (chatId: string) => {
    setCurrentChatId(chatId);
    try {
      const res = await fetch(`http://localhost:8000/history/${chatId}`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          const loadedMessages: Message[] = data.messages
            .filter((h: any) => h.role !== "system")
            .map((h: any) => ({
              id: h.id.toString(),
              role: h.role,
              content: h.message
            }));
          setMessages(loadedMessages);
        } else {
          setMessages([{ id: "1", role: "assistant", content: "Hello! I am ArogyAI, your AI-Driven Public Health Chatbot. You can ask me questions about diseases, symptoms, or preventive healthcare. How can I help you today?" }]);
        }
      }
    } catch (e) {
      console.error("Failed to load chat", e);
    }
  };

  const startEditingSession = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    setEditingSessionId(session.chat_id);
    const defaultTitle = session.chat_id === "demo-session-001" 
      ? "Demo Session" 
      : "Chat " + new Date(parseInt(session.chat_id.split('-')[1] || "0")).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    setEditingTitle(session.title || defaultTitle);
  };

  const saveEditSession = async (chatId: string) => {
    if (!editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:8000/sessions/${chatId}/title`, {
        method: 'PUT',
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({ title: editingTitle.trim() })
      });
      if (res.ok) {
        fetchSessions();
      }
    } catch (e) {
      console.error("Failed to save session title", e);
    }
    setEditingSessionId(null);
  };

  const deleteSession = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    try {
      await fetch(`http://localhost:8000/history/${chatId}`, { 
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      fetchSessions();
      if (currentChatId === chatId) {
        startNewChat();
      }
    } catch (error) {
      console.error("Failed to delete chat", error);
    }
    setActiveDropdown(null);
  };

  const startNewChat = () => {
    setCurrentChatId(generateNewChatId());
    setMessages([{ id: "1", role: "assistant", content: "Hello! I am ArogyAI, your AI-Driven Public Health Chatbot. You can ask me questions about diseases, symptoms, or preventive healthcare. How can I help you today?" }]);
  };

  // Auto-scroll reference
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle generating and playing TTS audio manually
  const playAudio = async (text: string, messageId: string) => {
    // If something is currently playing, stop it first
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
      setPlayingAudioId(null);
    }

    try {
      setPlayingAudioId(messageId);
      const response = await fetch("http://localhost:8000/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language })
      });

      if (!response.ok) throw new Error("TTS failed");

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);

      activeAudioRef.current = audio;

      audio.onended = () => {
        setPlayingAudioId(null);
        activeAudioRef.current = null;
      };

      audio.play();
    } catch (error) {
      console.error("Audio play failed:", error);
      setPlayingAudioId(null);
    }
  };

  const stopAudio = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    setPlayingAudioId(null);
  };

  // Handle Speech-to-Text
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    if (language === "hindi") recognition.lang = "hi-IN";
    else if (language === "telugu") recognition.lang = "te-IN";
    else if (language === "malayalam") recognition.lang = "ml-IN";
    else recognition.lang = "en-US";
    
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsMicOpen(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsMicOpen(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsMicOpen(false);
    };

    recognition.onend = () => setIsMicOpen(false);

    recognition.start();
  };

  // Handle sending message to the API
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput("");

    // Add user message to UI
    const newMsg: Message = { id: Date.now().toString(), role: "user", content: userMsg };
    setMessages((prev) => [...prev, newMsg]);
    setIsTyping(true);

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          chat_id: currentChatId,
          message: userMsg,
          language
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
          return;
        }
        throw new Error(data.detail || "API failed");
      }

      // Add bot reply to UI
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, botMsg]);

      // Note: Auto-play is removed so users can trigger TTS manually 
      fetchSessions(); // Refresh sidebar history
    } catch (error) {
      console.error("Error communicating with backend:", error);
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content: "Sorry, I am having trouble connecting to my servers right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  };

  // Handle Enter key submitting
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Dynamic Theme Classes
  const themeClasses = {
    bg: isDarkMode ? "bg-slate-950" : "bg-background",
    text: isDarkMode ? "text-slate-100" : "text-foreground",
    sidebarBg: isDarkMode ? "bg-slate-900 border-slate-800" : "bg-gray-50/50 border-gray-200",
    headerBorder: isDarkMode ? "border-slate-800" : "border-gray-200",
    buttonBg: isDarkMode ? "bg-slate-100 text-slate-900 hover:bg-white" : "bg-foreground text-background hover:opacity-90",
    historyItemBg: isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-100 text-foreground",
    historyItemHover: isDarkMode ? "hover:bg-slate-800/50 text-slate-300" : "hover:bg-gray-100 text-gray-700",
    mainBg: isDarkMode ? "bg-slate-950" : "bg-white",
    botBubble: isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-gray-50 border-gray-100 text-gray-800",
    userBubble: isDarkMode ? "bg-slate-100 text-slate-900" : "bg-foreground text-background",
    inputContainer: isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-gray-100",
    inputField: isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100 focus:ring-blue-500/40" : "bg-gray-50 border-gray-200 text-foreground focus:ring-blue-500/20",
    attachMenuBg: isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-gray-200 text-gray-700",
    attachMenuHover: isDarkMode ? "hover:bg-slate-800" : "hover:bg-gray-50",
    micOverlay: isDarkMode ? "bg-slate-950/90" : "bg-white/90",
    micCloseBtn: isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600",
    iconMuted: isDarkMode ? "text-slate-400" : "text-gray-400",
    iconHoverBg: isDarkMode ? "hover:bg-slate-800 hover:text-slate-200" : "hover:bg-gray-100 hover:text-foreground",
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${themeClasses.bg} ${themeClasses.text}`} onClick={() => setActiveDropdown(null)}>
      <Navbar />

      <main className="flex-1 flex pt-[88px] h-screen overflow-hidden">
        {/* Left Sidebar */}
        <aside className={`w-72 border-r flex flex-col hidden md:flex transition-colors duration-300 ${themeClasses.sidebarBg}`}>
          <div className={`p-4 border-b transition-colors duration-300 ${themeClasses.headerBorder}`}>
            <button onClick={startNewChat} className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-full font-medium text-sm transition-all shadow-sm ${themeClasses.buttonBg}`}>
              <Plus size={18} />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ml-2 ${themeClasses.iconMuted}`}>Recent History</h3>
              <div className="space-y-1">
                {sessions.length === 0 && (
                  <p className={`text-sm px-3 ${themeClasses.iconMuted}`}>No past sessions yet.</p>
                )}
                {sessions.map((session) => (
                  <div 
                    key={session.chat_id}
                    className={`group flex items-center w-full px-3 py-2.5 rounded-xl shadow-sm border text-sm font-medium transition-colors duration-300 ${session.chat_id === currentChatId ? 'ring-2 ring-blue-500/50' : ''} ${themeClasses.historyItemBg}`}
                  >
                    <button 
                      onClick={() => loadChat(session.chat_id)}
                      className="flex items-center gap-3 flex-1 text-left overflow-hidden h-full"
                    >
                      <MessageSquare size={16} className="text-blue-500 shrink-0" />
                      
                      {editingSessionId === session.chat_id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditSession(session.chat_id);
                            if (e.key === 'Escape') setEditingSessionId(null);
                          }}
                          onBlur={() => saveEditSession(session.chat_id)}
                          autoFocus
                          className={`flex-1 bg-transparent border-b border-blue-500 focus:outline-none focus:ring-0 px-1 py-0 min-w-0 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                        />
                      ) : (
                        <span className="truncate flex-1" title={session.title || session.chat_id}>
                          {session.title || (session.chat_id === "demo-session-001" ? "Demo Session" : "Chat " + new Date(parseInt(session.chat_id.split('-')[1] || "0")).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}))}
                        </span>
                      )}
                    </button>

                    {editingSessionId !== session.chat_id && (
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                             e.stopPropagation();
                             setActiveDropdown(activeDropdown === session.chat_id ? null : session.chat_id);
                          }}
                          className={`p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 ${themeClasses.iconMuted} hover:text-blue-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1`}
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {activeDropdown === session.chat_id && (
                          <div className={`absolute right-0 mt-1 w-32 rounded-lg shadow-lg border py-1 z-50 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-slate-800'}`}>
                            <button
                              onClick={(e) => {
                                startEditingSession(e, session);
                                setActiveDropdown(null);
                              }}
                              className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                            >
                              <Pencil size={14} /> Rename
                            </button>
                            <button
                              onClick={(e) => deleteSession(e, session.chat_id)}
                              className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-500 ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-red-50'}`}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <button 
                onClick={handleLogout}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20`}
              >
                <LogOut size={18} />
                Logout {typeof window !== 'undefined' && getToken() ? `(${localStorage.getItem("username") || "User"})` : ""}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Chat Interface */}
        <section className={`flex-1 flex flex-col relative transition-colors duration-300 ${themeClasses.mainBg}`}>

          {/* Chat Header (Visible on Desktop & Mobile with Language Dropdown) */}
          <div className={`p-4 border-b flex items-center justify-between transition-colors duration-300 ${themeClasses.headerBorder}`}>
            <span className="font-semibold text-lg hidden md:block">ArogyAI Chat</span>
            <span className="font-semibold text-lg md:hidden">Chat</span>

            <div className="flex items-center gap-2 ml-auto">
              <Globe size={18} className={themeClasses.iconMuted} />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`text-sm rounded-md border p-1.5 outline-none transition-colors ${themeClasses.bg} ${themeClasses.text} ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}
              >
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
                <option value="telugu">Telugu</option>
                <option value="tamil">Tamil</option>
                <option value="kannada">Kannada</option>
                <option value="malayalam">Malayalam</option>
                <option value="bengali">Bengali</option>
                <option value="marathi">Marathi</option>
                <option value="gujarati">Gujarati</option>
                <option value="punjabi">Punjabi</option>
                <option value="urdu">Urdu</option>
              </select>
            </div>

            <button className={`md:hidden ml-4 p-2 rounded-lg transition-colors ${themeClasses.iconMuted}`}>
              <Menu size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 pt-6 sm:pt-8 space-y-6 max-h-[calc(100vh-160px)]">

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 max-w-3xl mx-auto ${msg.role === "user" ? "flex-row-reverse" : ""}`}>

                {/* Avatar */}
                {msg.role === "assistant" ? (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={18} className="text-blue-600" />
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-200'}`}>
                    <User size={18} className={isDarkMode ? 'text-slate-300' : 'text-gray-600'} />
                  </div>
                )}

                {/* Bubble Container */}
                <div className="flex flex-col gap-2 max-w-[85%]">
                  <div className={`border rounded-2xl p-4 sm:p-5 leading-relaxed shadow-sm transition-colors duration-300 ${msg.role === "assistant" ? themeClasses.botBubble : themeClasses.userBubble}`}>
                    {msg.role === "assistant" ? (
                      <div className={`prose prose-sm sm:prose-base max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>

                  {/* TTS Controls (Only for Assistant) */}
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 px-2">
                      {playingAudioId === msg.id ? (
                        <button
                          onClick={stopAudio}
                          className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-md transition-colors ${isDarkMode ? 'bg-red-900/40 text-red-400 hover:bg-red-900/60' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                        >
                          <Square size={14} className="fill-current" />
                          Stop Reading
                        </button>
                      ) : (
                        <button
                          onClick={() => playAudio(msg.content, msg.id)}
                          className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-md transition-colors ${themeClasses.iconMuted} ${themeClasses.iconHoverBg}`}
                        >
                          <Volume2 size={14} />
                          Read Aloud
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-4 max-w-3xl mx-auto">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={18} className="text-blue-600" />
                </div>
                <div className={`border rounded-2xl p-4 sm:p-5 leading-relaxed shadow-sm transition-colors duration-300 ${themeClasses.botBubble}`}>
                  <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Area */}
          <div className={`p-4 sm:p-6 border-t transition-colors duration-300 ${themeClasses.inputContainer}`}>
            <div className="max-w-3xl mx-auto relative">

              <AnimatePresence>
                {isAttachOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute bottom-full left-0 mb-4 border rounded-2xl shadow-xl w-64 overflow-hidden z-20 ${themeClasses.attachMenuBg}`}
                  >
                    <div className="p-2 space-y-1">
                      <button onClick={() => setIsAttachOpen(false)} className={`flex items-center gap-3 w-full px-4 py-3 text-left rounded-xl transition-colors text-sm ${themeClasses.attachMenuHover}`}>
                        <ImageIcon size={18} className="text-blue-500" /> Photos & Videos
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative flex items-center">
                <button onClick={() => { setIsAttachOpen(!isAttachOpen); setIsMicOpen(false); }} className={`absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full transition-colors z-10 ${isAttachOpen ? "bg-blue-50 text-blue-600" : `${themeClasses.iconMuted} ${themeClasses.iconHoverBg}`}`}>
                  <Paperclip size={18} />
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping}
                  placeholder={isTyping ? "ArogyAI is thinking..." : "Ask about diseases, symptoms, or healthcare..."}
                  className={`w-full border rounded-full py-4 pl-12 pr-24 text-sm focus:outline-none focus:ring-2 transition-all shadow-sm ${themeClasses.inputField}`}
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button type="button" onClick={startListening} className={`p-2.5 rounded-full transition-colors ${themeClasses.iconMuted} hover:text-red-500 hover:bg-red-50`}>
                    <Mic size={18} />
                  </button>

                  <button onClick={handleSend} disabled={isTyping} className={`p-2.5 rounded-full hover:scale-105 transition-transform shadow-md ${themeClasses.buttonBg} disabled:opacity-50 disabled:hover:scale-100`}>
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
            <p className={`text-center text-xs mt-3 font-light transition-colors duration-300 ${themeClasses.iconMuted}`}>
              ArogyAI can make mistakes. Consider verifying important medical information with a doctor.
            </p>
          </div>

        </section>

        {/* Full Screen Mic Overlay (UI only) */}
        <AnimatePresence>
          {isMicOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 z-[100] backdrop-blur-sm flex items-center justify-center p-6 transition-colors duration-300 ${themeClasses.micOverlay}`}
            >
              <button onClick={() => setIsMicOpen(false)} className={`absolute top-8 right-8 p-3 rounded-full transition-colors ${themeClasses.micCloseBtn}`}>
                <X size={24} />
              </button>

              <div className="flex flex-col items-center">
                <motion.div animate={{ scale: [1, 1.2, 1], boxShadow: ["0 0 0 0px rgba(239, 68, 68, 0.4)", "0 0 0 30px rgba(239, 68, 68, 0)", "0 0 0 0px rgba(239, 68, 68, 0)"] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="w-24 h-24 bg-red-500 text-white rounded-full flex items-center justify-center mb-8 shadow-xl">
                  <Mic size={40} />
                </motion.div>
                <h2 className={`text-3xl font-light mb-2 transition-colors duration-300 ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>Listening...</h2>
                <p className={`transition-colors duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Speak your symptoms or health queries</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
