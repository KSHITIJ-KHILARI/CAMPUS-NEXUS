import { z } from "genkit";

export const ChatRoleSchema = z.enum(["student", "faculty", "admin"]);
export type ChatRole = z.infer<typeof ChatRoleSchema>;

export const ChatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  role: ChatRoleSchema.default("student"),
  userUid: z.string().optional(),
  userName: z.string().optional(),
  department: z.string().optional(),
  context: z.record(z.any()).optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  response: z.string(),
  tools_used: z.array(z.string()).default([]),
  confidence: z.number().default(0.95),
  sources: z.array(z.string()).default([]),
  model: z.string().default("gemini-2.5-flash"),
  timestamp: z.string().default(() => new Date().toISOString()),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;
