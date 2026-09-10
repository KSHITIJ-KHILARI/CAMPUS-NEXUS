import { NextRequest, NextResponse } from "next/server";
import { nexusAIFlow } from "@/genkit/flows/nexus-ai-flow";
import { ChatRequest } from "@/genkit/schemas/chat";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  error: err?.message || "Stream generation failed",
                  done: true,
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
        response: `Campus AI service encountered an issue: ${err?.message || "Internal server error"}.`,
        tools_used: ["error_handler"],
        confidence: 0.5,
        sources: ["api_error"],
        model: "error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
