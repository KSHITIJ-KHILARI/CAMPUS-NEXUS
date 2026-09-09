"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface Message {
  role: "user" | "assistant";
  content: string;
  tools?: string[];
  confidence?: number;
  sources?: string[];
  model?: string;
}

const suggestedQuestions = [
  "Where is my next class?",
  "Should I leave now?",
  "Is the library crowded?",
  "Find an available classroom in CSB",
  "Reserve Database System Concepts textbook",
];

export default function AIChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm NEXUS AI, your official Somaiya Vidyavihar campus intelligence assistant. How can I help you today?",
      tools: ["somaiya_institutional_core"],
      confidence: 1,
      model: "Genkit Orchestrator",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setStreamingText("");

    // Abort any previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          role: user?.role || "student",
          userUid: user?.id,
          userName: user?.name || user?.full_name || (user?.role === "faculty" ? "Faculty" : "Student"),
          department: (user as any)?.department,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.response || `Request failed (${res.status})`);
      }

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream") && res.body) {
        // SSE streaming — show tokens as they arrive
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let finalMeta: any = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.done) {
                finalMeta = payload;
              } else if (payload.chunk) {
                accumulated += payload.chunk;
                setStreamingText(accumulated);
              } else if (payload.error) {
                accumulated += `\n\n⚠ ${payload.error}`;
                setStreamingText(accumulated);
              }
            } catch {}
          }
        }

        // Commit final message
        const assistantMsg: Message = {
          role: "assistant",
          content: accumulated || "I received your query but generated no textual response.",
          tools: finalMeta?.tools_used || ["somaiya_campus_grounding"],
          confidence: finalMeta?.confidence ?? 0.95,
          sources: finalMeta?.sources || ["somaiya_nexus_db"],
          model: finalMeta?.model || "gemini-2.5-flash",
        };
        setStreamingText("");
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        // JSON fallback (non-streaming)
        const data = await res.json();
        const assistantMsg: Message = {
          role: "assistant",
          content: data?.response || "I received your query but generated no textual response.",
          tools: data?.tools_used || ["somaiya_campus_grounding"],
          confidence: data?.confidence ?? 0.95,
          sources: data?.sources || ["somaiya_nexus_db"],
          model: data?.model || "gemini-2.5-flash",
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      let msg = "Campus service is temporarily unavailable.";
      if (err?.status === 401 || err?.status === 403) {
        msg = "Your session has expired. Please sign in again.";
      } else if (err?.message) {
        msg = `I encountered an issue querying campus services: ${err.message}`;
      }
      setStreamingText("");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: msg,
          tools: ["error_handler"],
          confidence: 0.5,
          model: "error-recovery",
        },
      ]);
    } finally {
      setLoading(false);
      setStreamingText("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">NEXUS AI Assistant</h1>
            <p className="text-xs text-gray-400">Powered by Google Genkit AI Orchestration & Somaiya Institutional Ground Truth</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/student/pulse">
            <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs">
              <Sparkles className="w-4 h-4 mr-2" /> View Campus Pulse
            </Button>
          </a>
          <Badge variant="info" className="hidden md:inline-flex">Institutional Ground Truth</Badge>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-white/10">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0 text-red-400">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  message.role === "user"
                    ? "bg-red-600 text-white font-medium shadow-lg shadow-red-600/20"
                    : "bg-white/5 border border-white/10 text-gray-200"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                {message.tools && message.tools.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {message.model && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 font-mono">
                        {message.model}
                      </span>
                    )}
                    {message.tools.map((tool) => (
                      <span key={tool} className="text-[10px] px-2 py-0.5 rounded-md bg-black/40 border border-white/10 text-gray-400 font-mono">
                        tool: {tool}
                      </span>
                    ))}
                  </div>
                )}
                {message.confidence && (
                  <p className="text-[10px] text-gray-500 mt-1.5">
                    Ground Truth Confidence: {Math.round(message.confidence * 100)}%
                  </p>
                )}
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-blue-400">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {/* Streaming in-progress message */}
          {loading && streamingText && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0 text-red-400">
                <Bot className="h-4 w-4" />
              </div>
              <div className="max-w-[80%] p-4 rounded-2xl bg-white/5 border border-white/10 text-gray-200">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{streamingText}<span className="inline-block w-1.5 h-4 bg-red-500 ml-0.5 animate-pulse rounded-sm" /></p>
              </div>
            </div>
          )}

          {/* Waiting indicator (before any tokens arrive) */}
          {loading && !streamingText && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                  <span className="text-xs text-gray-400 ml-2">Consulting Campus Digital Twin...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {suggestedQuestions.map((question) => (
              <Button
                key={question}
                variant="outline"
                size="sm"
                onClick={() => handleSend(question)}
                className="text-xs border-white/10 hover:bg-white/10 text-gray-300 rounded-xl"
              >
                {question}
              </Button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask NEXUS about schedule, rooms, library books, or campus status..."
              className="flex-1 bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-500"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
