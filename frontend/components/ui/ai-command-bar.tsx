"use client";

import { useState, useRef, useEffect, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Send, Bot, User, Sparkles, Mic, Paperclip } from "lucide-react";
import { api } from "@/lib/api-client";
import { AIResponse, AgentTool } from "@/lib/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  type?: "text" | "tool_call" | "result";
  tools?: AgentTool[];
  suggestedActions?: Array<{ label: string; action: () => void; icon?: React.ReactNode }>;
}

export interface AICommandBarProps {
  placeholder?: string;
  onSubmit: (message: string) => void;
  isLoading?: boolean;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  className?: string;
}

const AICommandBar = forwardRef<HTMLFormElement, AICommandBarProps>(
  (
    { placeholder = "Ask NEXUS AI anything about campus...", onSubmit, isLoading, suggestions, onSuggestionClick, className },
    ref
  ) => {
    const [value, setValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!value.trim() || isLoading) return;
      onSubmit(value.trim());
      setValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        inputRef.current?.blur();
      }
    };

    return (
      <div className={cn("w-full", className)}>
        <form
          ref={ref}
          onSubmit={handleSubmit}
          className="relative"
        >
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className={cn(
                "w-full rounded-xl border border-surface-700 bg-surface-800/50 pl-4 pr-12 py-3",
                "text-surface-100 placeholder:text-surface-500",
                "focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500",
                "transition-colors"
              )}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                className="rounded-md p-1 text-surface-500 hover:text-surface-300"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded-md p-1 text-surface-500 hover:text-surface-300"
              >
                <Mic className="h-4 w-4" />
              </button>
              <button
                type="submit"
                disabled={!value.trim() || isLoading}
                className={cn(
                  "rounded-md p-1.5 text-white transition-colors",
                  "bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>

        {suggestions && suggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick?.(suggestion)}
                className={cn(
                  "rounded-lg border border-surface-700 bg-surface-800/30 px-3 py-1.5",
                  "text-xs text-surface-300 transition-colors",
                  "hover:border-brand-500/50 hover:bg-surface-800/50"
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);
AICommandBar.displayName = "AICommandBar";

export interface AIChatProps {
  messages?: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  suggestions?: string[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export function AIChat({
  messages = [],
  onSendMessage,
  isLoading = false,
  suggestions = [],
  title = "NEXUS AI",
  subtitle = "Ask me about campus life, schedules, and more...",
  className,
}: AIChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border border-surface-700 bg-surface-900/50",
        className
      )}
    >
      <div className="border-b border-surface-700 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10">
            <Sparkles className="h-4 w-4 text-brand-400" />
          </div>
          <div>
            <h2 className="font-semibold text-surface-100">{title}</h2>
            <p className="text-xs text-surface-500">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4" ref={messagesEndRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  message.role === "user"
                    ? "bg-brand-500 text-white"
                    : "bg-surface-700 text-surface-200"
                )}
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-4 py-2.5 text-sm",
                  message.role === "user"
                    ? "rounded-br-none bg-brand-500 text-white"
                    : "rounded-bl-none bg-surface-800/50 text-surface-200"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-700">
                <Bot className="h-4 w-4 text-surface-200" />
              </div>
              <div className="rounded-xl bg-surface-800/50 px-4 py-2.5 text-sm">
                <div className="flex space-x-1">
                  <span className="animate-bounce">·</span>
                  <span className="animate-bounce delay-75">·</span>
                  <span className="animate-bounce delay-150">·</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-surface-700 p-4">
        <AICommandBar
          onSubmit={onSendMessage}
          isLoading={isLoading}
          suggestions={suggestions}
        />
      </div>
    </div>
  );
}

export { AICommandBar };
