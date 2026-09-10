import { ai, hasGeminiKey, getPrimaryModel, getFallbackModel } from "../ai";
import {
  ChatRequest,
  ChatRequestSchema,
  ChatResponse,
  ChatResponseSchema,
} from "../schemas/chat";
import {
  campusTools,
  getStudentScheduleTool,
  getFacultyScheduleTool,
  getVacantRoomsTool,
  getLibraryCatalogTool,
  checkFacultyAvailabilityTool,
  getActiveIssuesTool,
} from "../tools/campus-tools";

export const nexusAIFlow = ai.defineFlow(
  {
    name: "nexusAIFlow",
    inputSchema: ChatRequestSchema,
    outputSchema: ChatResponseSchema,
  },
  async (input: ChatRequest, context?: any): Promise<ChatResponse> => {
    const sendChunk = context?.sendChunk;
    const role = input.role || "student";
    const userName = input.userName || (role === "student" ? "Student" : role === "faculty" ? "Professor" : "Administrator");

    const toolsUsed: string[] = [];
    const lower = (input.message || "").toLowerCase();
    let liveGroundTruth = "";

    // Proactively invoke relevant campus tools IN PARALLEL for speed
    const toolPromises: Promise<void>[] = [];

    if (
      lower.includes("class") ||
      lower.includes("schedule") ||
      lower.includes("timetable") ||
      lower.includes("lecture") ||
      lower.includes("next") ||
      lower.includes("where is") ||
      lower.includes("when is")
    ) {
      if (role === "faculty") {
        toolPromises.push(
          getFacultyScheduleTool({ facultyName: userName, userUid: input.userUid })
            .then((r) => { toolsUsed.push("getFacultySchedule"); liveGroundTruth += `\n- Faculty Schedule: ${JSON.stringify(r)}`; })
            .catch((e) => console.warn("getFacultySchedule failed:", e))
        );
      } else {
        toolPromises.push(
          getStudentScheduleTool({ userUid: input.userUid })
            .then((r) => { toolsUsed.push("getStudentSchedule"); liveGroundTruth += `\n- Student Schedule: ${JSON.stringify(r)}`; })
            .catch((e) => console.warn("getStudentSchedule failed:", e))
        );
      }
    }

    if (
      lower.includes("vacant") ||
      lower.includes("empty") ||
      lower.includes("room") ||
      lower.includes("pod") ||
      lower.includes("space")
    ) {
      toolPromises.push(
        getVacantRoomsTool({ type: lower.includes("pod") ? "study_pod" : "all", limit: 5 })
          .then((r) => { toolsUsed.push("getVacantRooms"); liveGroundTruth += `\n- Vacant Rooms & Pods: ${JSON.stringify(r)}`; })
          .catch((e) => console.warn("getVacantRooms failed:", e))
      );
    }

    if (
      lower.includes("book") ||
      lower.includes("library") ||
      lower.includes("catalog") ||
      lower.includes("study guide") ||
      lower.includes("textbook") ||
      lower.includes("clrs") ||
      lower.includes("database") ||
      lower.includes("algorithms")
    ) {
      toolPromises.push(
        getLibraryCatalogTool({ query: input.message })
          .then((r) => { toolsUsed.push("getLibraryCatalog"); liveGroundTruth += `\n- Library Catalog: ${JSON.stringify(r)}`; })
          .catch((e) => console.warn("getLibraryCatalog failed:", e))
      );
    }

    if (
      lower.includes("sharma") ||
      lower.includes("kulkarni") ||
      lower.includes("patil") ||
      lower.includes("professor") ||
      lower.includes("faculty") ||
      lower.includes("office hour") ||
      lower.includes("availability")
    ) {
      const profName = lower.includes("kulkarni")
        ? "Prof. Rajesh Kulkarni"
        : lower.includes("patil")
        ? "Dr. Sneha Patil"
        : "Dr. Priya Sharma";
      toolPromises.push(
        checkFacultyAvailabilityTool({ professorName: profName })
          .then((r) => { toolsUsed.push("checkFacultyAvailability"); liveGroundTruth += `\n- Faculty Availability: ${JSON.stringify(r)}`; })
          .catch((e) => console.warn("checkFacultyAvailability failed:", e))
      );
    }

    if (
      lower.includes("issue") ||
      lower.includes("maintenance") ||
      lower.includes("ticket") ||
      lower.includes("broken") ||
      lower.includes("repair")
    ) {
      toolPromises.push(
        getActiveIssuesTool({})
          .then((r) => { toolsUsed.push("getActiveIssues"); liveGroundTruth += `\n- Campus Maintenance Issues: ${JSON.stringify(r)}`; })
          .catch((e) => console.warn("getActiveIssues failed:", e))
      );
    }

    // Wait for ALL tool calls to complete in parallel
    if (toolPromises.length > 0) {
      await Promise.allSettled(toolPromises);
    }


    const systemInstruction = `You are NEXUS AI, the official campus intelligence assistant for Somaiya Vidyavihar University (SVU / KJSCE).
Your role is to assist the user based on their official institutional identity.
The current user is: ${userName}, Role: ${role.toUpperCase()}.
Department: ${input.department || "Engineering & Technology"}.

CORE INSTRUCTIONS:
1. Always maintain role separation:
   - Students: Focus on schedules, classroom numbers, exam study kits, textbook checkout, quiet library pods.
   - Faculty: Focus on assigned lecture halls, teaching schedules, student enrollment, classroom changes.
   - Admin: Focus on institutional overview, room allocation, active maintenance reports.
2. Note: Campus Pulse is a separate campus feature — do not simulate or claim to operate Campus Pulse within NEXUS AI.
3. Ground your answers in the accurate campus facts provided below.
4. Be concise, polite, articulate, and accurate. Never invent non-existent campus facts.

OFFICIAL SOMAIYA LIVE REALITY DATA:
${liveGroundTruth || "Somaiya Institutional Academic Term 2025-2026 Active."}`;

    // Helper to run generation with streaming or standard
    async function executeWithModel(modelRef: any, useTools: boolean = false) {
      const toolsToPass = useTools ? campusTools : undefined;
      if (sendChunk) {
        const { response, stream } = ai.generateStream({
          model: modelRef,
          system: systemInstruction,
          prompt: input.message,
          tools: toolsToPass,
          config: {
            temperature: 0.2,
          },
        });

        for await (const chunk of stream) {
          if (chunk.text && sendChunk) {
            sendChunk(chunk.text);
          }
        }
        return await response;
      } else {
        return await ai.generate({
          model: modelRef,
          system: systemInstruction,
          prompt: input.message,
          tools: toolsToPass,
          config: {
            temperature: 0.2,
          },
        });
      }
    }

    function extractText(res: any): string {
      if (res?.text && typeof res.text === "string" && res.text.trim()) {
        return res.text.trim();
      }
      if (res?.candidates && res.candidates.length > 0) {
        for (const cand of res.candidates) {
          if (cand.message?.content) {
            for (const part of cand.message.content) {
              if (part.text && typeof part.text === "string" && part.text.trim()) {
                return part.text.trim();
              }
            }
          }
        }
      }
      if (res?.messages && res.messages.length > 0) {
        for (const msg of [...res.messages].reverse()) {
          if (msg.content) {
            for (const part of msg.content) {
              if (part.text && typeof part.text === "string" && part.text.trim()) {
                return part.text.trim();
              }
            }
          }
        }
      }
      return "";
    }

    try {
      let resultText = "";
      let modelUsed = "gemini-3.6-flash";

      const lowerMsg = input.message.toLowerCase().trim();
      const isSimpleGreeting = lowerMsg === "hi" || lowerMsg === "hello" || lowerMsg === "hey";

      if (hasGeminiKey()) {
        try {
          const res = await executeWithModel(getPrimaryModel(), !isSimpleGreeting);
          resultText = extractText(res);
          modelUsed = "gemini-3.6-flash";

          // Track which tools were triggered dynamically
          if (res.messages) {
            for (const msg of res.messages) {
              if (msg.content) {
                for (const part of msg.content) {
                  if ((part as any).toolRequest?.name) {
                    const tName = (part as any).toolRequest.name;
                    if (!toolsUsed.includes(tName)) {
                      toolsUsed.push(tName);
                    }
                  }
                }
              }
            }
          }

          // If resultText is empty (e.g. Gemini generated tool calls but no final text), retry without tools
          if (!resultText) {
            const resDirect = await executeWithModel(getPrimaryModel(), false);
            resultText = extractText(resDirect);
          }
        } catch (geminiErr: any) {
          console.warn("Primary Gemini 3.6 Flash failed, attempting fallback to local Ollama:", geminiErr?.message || geminiErr);
          try {
            const resFallback = await executeWithModel(getFallbackModel(), false);
            resultText = extractText(resFallback);
            modelUsed = "gemini-3.6-flash";
          } catch (fbErr: any) {
            console.warn("Gemini 3.6 Flash fallback failed, attempting local Ollama:", fbErr?.message || fbErr);
            const abortController = new AbortController();
            const id = setTimeout(() => abortController.abort(), 2000);
            try {
              const resOllama = await executeWithModel("ollama/gemma4:latest", false);
              resultText = extractText(resOllama);
              modelUsed = "ollama/gemma4:latest";
            } finally {
              clearTimeout(id);
            }
          }
        }
      } else {
        try {
          const resOllama = await executeWithModel("ollama/gemma4:latest", false);
          resultText = extractText(resOllama);
          modelUsed = "ollama/gemma4:latest";
        } catch (ollamaErr: any) {
          console.warn("Ollama local generation failed:", ollamaErr?.message || ollamaErr);
          resultText = `Hello ${userName}! NEXUS AI is currently in offline institutional mode. Please configure GEMINI_API_KEY in frontend/.env.local or ensure Ollama is running on localhost:11434 with gemma4.`;
          modelUsed = "offline-fallback";
        }
      }

      if (toolsUsed.length === 0) {
        toolsUsed.push("somaiya_campus_grounding");
      }

      const defaultFallbackText = `Hello ${userName}! I have analyzed your request regarding Somaiya Vidyavihar University. ${liveGroundTruth ? 'Here is the relevant institutional info: ' + liveGroundTruth : 'How else can I assist you with your schedule or campus services?'}`;

      return {
        response: resultText || defaultFallbackText,
        tools_used: toolsUsed,
        confidence: modelUsed.startsWith("gemini") ? 0.98 : 0.92,
        sources: ["somaiya_institutional_core", modelUsed],
        model: modelUsed,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error("Critical error in nexusAIFlow:", err);
      return {
        response: `NEXUS AI service encountered an issue: ${err?.message || "Service temporarily unavailable"}. The rest of the Campus NEXUS application continues to operate normally.`,
        tools_used: ["error_handler"],
        confidence: 0.5,
        sources: ["error_recovery"],
        model: "error-recovery",
        timestamp: new Date().toISOString(),
      };
    }
  }
);
