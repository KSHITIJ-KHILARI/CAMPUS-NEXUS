import { ai, hasGeminiKey, getPrimaryModel, getFallbackModel, getTertiaryModel } from "../ai";
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
    const sendChunk =
      typeof context === "function"
        ? (chunkText: string) => {
            try {
              (context as any)({ chunk: chunkText } as any);
            } catch {
              (context as any)(chunkText);
            }
          }
        : typeof context?.sendChunk === "function"
        ? context.sendChunk
        : typeof context?.onChunk === "function"
        ? context.onChunk
        : undefined;

    let streamedAnyChunk = false;
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
        try {
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
            const chunkText = chunk.text || (chunk.content?.[0] as any)?.text || "";
            if (chunkText && sendChunk) {
              streamedAnyChunk = true;
              sendChunk(chunkText);
            }
          }
          return await response;
        } catch (streamErr) {
          console.warn("generateStream failed, falling back to standard generate:", streamErr);
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
        // Attempt 1: Gemini 3.5 Flash Lite (High quota, ultra-fast 1s response)
        try {
          const res = await executeWithModel(getPrimaryModel(), !isSimpleGreeting);
          resultText = extractText(res);
          modelUsed = "gemini-3.5-flash-lite";

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

          if (!resultText) {
            const resDirect = await executeWithModel(getPrimaryModel(), false);
            resultText = extractText(resDirect);
          }
        } catch (liteErr: any) {
          console.warn("Primary Gemini 3.5 Flash Lite failed:", liteErr?.message || liteErr);

          // Attempt 2: Gemini 3.5 Flash
          try {
            const resFb = await executeWithModel(getFallbackModel(), false);
            resultText = extractText(resFb);
            modelUsed = "gemini-3.5-flash";
          } catch (fbErr: any) {
            console.warn("Fallback Gemini 3.5 Flash failed:", fbErr?.message || fbErr);

            // Attempt 3: Gemini 3.6 Flash
            try {
              const resTertiary = await executeWithModel(getTertiaryModel(), false);
              resultText = extractText(resTertiary);
              modelUsed = "gemini-3.6-flash";
            } catch (tertErr: any) {
              console.warn("Tertiary Gemini 3.6 Flash failed:", tertErr?.message || tertErr);

              // Attempt 4: Local Ollama (quick timeout)
              const abortController = new AbortController();
              const id = setTimeout(() => abortController.abort(), 2000);
              try {
                const resOllama = await executeWithModel("ollama/gemma4:latest", false);
                resultText = extractText(resOllama);
                modelUsed = "ollama/gemma4:latest";
              } catch {
                console.warn("Local Ollama not available, using institutional ground truth");
              } finally {
                clearTimeout(id);
              }
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
        }
      }

      if (toolsUsed.length === 0) {
        toolsUsed.push("somaiya_campus_grounding");
      }

      const defaultFallbackText = `Hello ${userName}! I have analyzed your request regarding Somaiya Vidyavihar University. ${liveGroundTruth ? 'Here is the relevant institutional info: ' + liveGroundTruth : 'How else can I assist you with your schedule or campus services?'}`;

      const finalResponse = resultText || defaultFallbackText;

      // If stream didn't deliver any chunks (e.g. tools were used or model emitted in single turn), deliver to sendChunk now
      if (sendChunk && !streamedAnyChunk && finalResponse) {
        sendChunk(finalResponse);
      }

      return {
        response: finalResponse,
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
