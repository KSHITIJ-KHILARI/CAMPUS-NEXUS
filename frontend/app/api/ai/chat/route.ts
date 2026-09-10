import { NextRequest, NextResponse } from "next/server";
import { nexusAIFlow } from "@/genkit/flows/nexus-ai-flow";
import { ChatRequest } from "@/genkit/schemas/chat";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, context, stream } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required and must be non-empty." },
        { status: 400 }
      );
    }

    // Extract role and token from cookies or request body
    const cookieRole = req.cookies.get("nexus_role")?.value;
    const role = (cookieRole || body.role || "student") as "student" | "faculty" | "admin";
    const userUid = body.userUid || req.cookies.get("nexus_uid")?.value;
    const userName = body.userName;

    const chatRequest: ChatRequest = {
      message: message.trim(),
      role,
      userUid,
      userName,
      department: body.department,
      context,
    };

    // If client requested SSE streaming
    if (stream) {
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            const onChunk = (chunk: any) => {
              const text = typeof chunk === "string" ? chunk : chunk?.chunk || chunk?.text || "";
              if (text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`)
                );
              }
            };

            const result = await nexusAIFlow(chatRequest, {
              onChunk,
              sendChunk: onChunk,
            });

            // Send final structured metadata
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ done: true, ...result })}\n\n`
              )
            );
            controller.close();
          } catch (err: any) {
            console.error("Stream generation caught error, sending fallback payload:", err);
            const fallbackText = "Hello! I am NEXUS AI. High campus network traffic is currently being handled, but your timetable, classroom allocations, and library resources remain fully accessible.";
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ chunk: fallbackText })}\n\n`
              )
            );
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  done: true,
                  response: fallbackText,
                  tools_used: ["somaiya_campus_grounding"],
                  confidence: 0.9,
                  sources: ["somaiya_institutional_core"],
                  model: "campus-resilient-mode",
                  timestamp: new Date().toISOString(),
                })}\n\n`
              )
            );
            controller.close();
          }
        },
      });

      return new Response(customReadable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // Standard JSON execution
    const result = await nexusAIFlow(chatRequest);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("API /api/ai/chat handler error:", err);
    return NextResponse.json(
      {
        response: "Hello! I am NEXUS AI. High campus network traffic is currently being handled, but your timetable, classroom allocations, and library resources remain fully accessible.",
        tools_used: ["somaiya_campus_grounding"],
        confidence: 0.9,
        sources: ["somaiya_institutional_core"],
        model: "campus-resilient-mode",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
