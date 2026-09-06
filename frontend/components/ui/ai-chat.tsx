"use client";

import { useState, useRef, useEffect, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Send, Bot, User, Sparkles, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { AIResponse, AgentTool } from "@/lib/types";

export interface ChatMessage {
  id: string;
  role: "user" |"assistant" | "system";
  content: string;
  timestamp: Date;
  type?: "text" | "tool_call" | "result";
  tools?: AgentTool[];
  suggestedActions?: Array<{ label: string; action: () => void; icon?: React.ReactNode }>;
}

export interface AIChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  suggestions?: string[];
  placeholder?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const AIChat = forwardRef<HTMLDivElement, AIChatProps>(
  ({
    messages,
    onSendMessage,
    isLoading = false,
    suggestions = [],
    placeholder = "Ask NEXUS AI...",
    title = "NEXUS AI",
    subtitle,
    className,
  }, ref) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = () => {
      if (!inputValue.trim() || isLoading) return;
      onSendMessage(inputValue.trim());
      setInputValue("");
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full flex-col rounded-xl border border-surface-700 bg-surface-900/50",
          className
        )}
      >
        {(title || subtitle) && (
          <div className="border-b border-surface-700 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10">
                <Sparkles className="h-4 w-4 text-brand-400" />
              </div>
              <div>
                {title && <h2 className="font-semibold text-surface-100">{title}</h2>}
                {subtitle && <p className="text-xs text-surface-500">{subtitle}</p>}
              </div>
            </div>
          </div>
        )}

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
                    "group relative max-w-[80%] rounded-xl px-4 py-2.5 text-sm",
                    message.role === "user"
                      ? "rounded-br-none bg-brand-600 text-white"
                      : "rounded-bl-none bg-surface-800/50 text-surface-200"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>

                  {message.suggestedActions &&
                    message.suggestedActions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {message.suggestedActions.map((action, i) => (
                          <button
                            key={i}
                            onClick={action.action}
                            className={cn(
                              "rounded-md border border-surface-700 px-2 py-1 text-xs",
                              "hover:bg-surface-700/50 transition-colors"
                            )}
                          >
                            {action.icon}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}

                  {message.role === "assistant" && (
                    <div className="absolute -bottom-6 right-0 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() =>
                          copyToClipboard(message.content)
                        }
                        className="rounded-md p-1 text-surface-500 hover:bg-surface-800 hover:text-surface-300"
                        title="Copy"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        className="rounded-md p-1 text-surface-500 hover:bg-surface-800 hover:text-surface-300"
                        title="Thumbs up"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button
                        className="rounded-md p-1 text-surface-500 hover:bg-surface-800 hover:text-surface-300"
                        title="Thumbs down"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-700">
                  <Bot className="h-4 w-4 text-surface-200 animate-pulse" />
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
          {suggestions && suggestions.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(suggestion)}
                  className={cn(
                    "rounded-lg border border-surface-700 bg-surface-800/30 px-3 py-1.5 text-xs",
                    "text-surface-300 transition-colors",
                    "hover:border-brand-500/50 hover:bg-surface-800"
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className={cn(
                "w-full rounded-xl border border-surface-700 bg-surface-800/50 pl-4 pr-12 py-3",
                "text-surface-100 placeholder:text-surface-500",
                "focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500"
              )}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white",
                "bg-brand-600 hover:bg-brand-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }
);
AIChat.displayName = "AIChat";
