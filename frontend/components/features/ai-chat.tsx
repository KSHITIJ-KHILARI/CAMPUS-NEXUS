"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, Sparkles } from "lucide-react";
import { api } from "@/lib/api-client";

interface Message {
  role: "user" | "assistant";
  content: string;
  tools?: string[];
  confidence?: number;
  sources?: string[];
}

const suggestedQuestions = [
  "Where is my next class?",
  "Should I leave now?",
  "Is the library crowded?",
  "Find an available classroom in CSB",
  "Reserve Database System Concepts textbook",
];

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm NEXUS AI, your official Somaiya Vidyavihar campus intelligence assistant. How can I help you today?",
      tools: ["somaiya_nexus_db"],
      confidence: 1,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.ai.sendMessage({ message: text });
      const assistantMsg: Message = {
        role: "assistant",
        content:
          res?.response ||
          "I am NEXUS AI. I am unable to retrieve an answer right now, but your request reached the authenticated campus services.",
        tools: res?.tools_used || ["campus_intelligence"],
        confidence: res?.confidence ?? 0.9,
        sources: res?.sources || ["somaiya_nexus_db"],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      let msg = "Campus service is temporarily unavailable.";
      if (err?.status === 401 || err?.status === 403) {
        msg = "Your session has expired. Please sign in again.";
      } else if (err?.message) {
        msg = `I encountered an issue querying campus services: ${err.message}`;
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: msg,
          tools: ["error_handler"],
          confidence: 0.5,
        },
      ]);
    } finally {
      setLoading(false);
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
            <p className="text-xs text-gray-400">Powered by Single Server NEXUS_API_KEY & PostgreSQL Digital Twin</p>
          </div>
        </div>
        <Badge variant="info">Institutional Ground Truth</Badge>
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
                  <div className="mt-3 flex flex-wrap gap-1">
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
          {loading && (
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
