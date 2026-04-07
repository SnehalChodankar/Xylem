"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, Sparkles, User, RotateCcw, Trash2 } from "lucide-react";
import { generateFinancialContext } from "@/lib/ai-context";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const QUICK_PROMPTS = [
  "What are my top 3 expenses this month?",
  "Am I on track to hit my budgets?",
  "How much 'Free Savings' do I have across all accounts?",
  "Summarize my recent transactions.",
];

export default function ChatPage() {
  const [chatKey, setChatKey] = useState(0);

  const resetChat = () => {
    console.log("RESETTING_CHAT_SYSTEM...");
    localStorage.removeItem("xylem_chat_history");
    setChatKey(prev => prev + 1);
  };

  // Re-initializing the entire chat view with a new key ensures the useChat hook resets fully.
  return <ChatView key={chatKey} onReset={resetChat} />;
}

function ChatView({ onReset }: { onReset: () => void }) {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [userInput, setUserInput] = useState("");

  const chat: any = useChat({
    api: "/api/chat",
  } as any);

  const { messages = [], input = "", handleInputChange, handleSubmit, append, setMessages, isLoading = false, error } = chat || {};

  // 1. Persistence: Hydrate history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("xylem_chat_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error("Failed to parse chat history:", e);
      }
    }
    setHasHydrated(true);
  }, [setMessages]);

  // 2. Persistence: Sync history to localStorage when messages change
  useEffect(() => {
    if (hasHydrated) {
      if (messages.length > 0) {
        localStorage.setItem("xylem_chat_history", JSON.stringify(messages));
      } else {
        localStorage.removeItem("xylem_chat_history");
      }
    }
  }, [messages, hasHydrated]);

  const submitToAI = (text: string) => {
    const freshContext = generateFinancialContext();
    const payload = { role: "user", content: text };
    const options = { body: { financialContext: freshContext } };

    if (chat?.append) {
      chat.append(payload, options);
    } else if (chat?.sendMessage) {
      chat.sendMessage(payload, options); 
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;
    submitToAI(userInput.trim());
    setUserInput("");
  };

  const renderMessageContent = (m: any) => {
    if (m.role === "user") {
      return <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>;
    }
    const content = m.content || "";
    const parts = m.parts || [];
    if (content) return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>;
    if (parts.length > 0) {
      return (
        <div className="space-y-4">
          {parts.map((part: any, i: number) => {
            if (part.type === "text") return <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>;
            if (part.type === "reasoning") return (
              <div key={i} className="text-secondary-foreground/60 italic text-xs bg-secondary/30 p-2 rounded-lg border-l-2 border-secondary">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.reasoning}</ReactMarkdown>
              </div>
            );
            return null;
          })}
        </div>
      );
    }
    return <p className="italic text-muted-foreground">Generating response...</p>;
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleResetClick = () => {
    if (!showClearConfirm) {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    } else {
      onReset();
      setShowClearConfirm(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] lg:h-[calc(100vh-140px)] max-w-4xl mx-auto p-4 pt-6">
      <div className="flex-none mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight inline-flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> Xylem AI
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your personal financial assistant with hyper-accurate knowledge of your actual ledger.
          </p>
        </div>
        
        {messages.length > 0 && (
          <Button 
            variant={showClearConfirm ? "destructive" : "outline"}
            size="sm" 
            onClick={handleResetClick}
            className={`rounded-xl transition-all ${
              !showClearConfirm ? "border-border/50 text-muted-foreground hover:text-destructive hover:border-destructive" : "animate-pulse"
            }`}
          >
            {showClearConfirm ? <><Trash2 className="w-3.5 h-3.5 mr-2" />Confirm Reset?</> : <><RotateCcw className="w-3.5 h-3.5 mr-2" />New Chat</>}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-6 pr-2 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">How can I help you today?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 max-w-lg w-full">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button key={i} onClick={() => submitToAI(prompt)} className="p-3 text-sm text-left border border-border/50 bg-card rounded-xl hover:bg-muted/50 transition-colors">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m: any) => (
            <div key={m.id} className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-2xl ${m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted/50 border border-border/50 text-foreground rounded-tl-sm prose prose-sm dark:prose-invert"}`}>
                {renderMessageContent(m)}
              </div>
            </div>
          ))
        )}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground"><Bot className="w-4 h-4" /></div>
            <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 text-foreground rounded-tl-sm flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" /><div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" /><div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="flex-none pb-4 pt-2">
        <form onSubmit={handleManualSubmit} className="relative max-w-4xl mx-auto flex items-center gap-2">
          <input className="w-full flex-1 p-4 pr-14 rounded-2xl border border-input bg-background/50 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" value={userInput} placeholder="Ask your financial assistant..." onChange={(e) => setUserInput(e.target.value)} disabled={isLoading} />
          <Button type="submit" disabled={isLoading || !userInput.trim()} size="icon" className="absolute right-2 rounded-xl"><Send className="w-4 h-4" /></Button>
        </form>
      </div>
    </div>
  );
}
