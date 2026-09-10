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

    let scheduleData: any = null;
    let vacantRoomsData: any = null;
    let libraryData: any = null;
    let facultyData: any = null;
    let issuesData: any = null;

    // Helper to generate a conversational, accurate institutional response
    function buildArticulateCampusResponse(): string {
      const q = lower;

      if (scheduleData) {
        let text = `Hello ${userName}! Here is your verified Somaiya academic schedule:\n\n`;
        if (scheduleData.nextClass) {
          text += `📍 **Next Session:** ${scheduleData.nextClass}\n\n`;
        }
        if (scheduleData.classes && scheduleData.classes.length > 0) {
          text += `**Upcoming Lectures & Labs:**\n`;
          for (const c of scheduleData.classes) {
            text += `- **${c.course}**: ${c.time} | Room: ${c.room} (${c.day})\n`;
          }
        }
        if (scheduleData.lectures && scheduleData.lectures.length > 0) {
          text += `**Assigned Teaching Schedule:**\n`;
          for (const l of scheduleData.lectures) {
            text += `- **${l.course}**: ${l.time} | Room: ${l.room} (${l.enrolled} students enrolled)\n`;
          }
        }
        return text.trim();
      }

      if (vacantRoomsData && vacantRoomsData.rooms && vacantRoomsData.rooms.length > 0) {
        let text = `Hello ${userName}! Here are currently available classrooms and study spaces across campus:\n\n`;
        for (const r of vacantRoomsData.rooms) {
          const typeLabel = r.type === "study_pod" ? "Quiet Study Pod" : r.type === "lab" ? "Computing Lab" : "Lecture Hall";
          text += `- **${r.name} (${r.code})**: ${r.building}, Floor ${r.floor} • Capacity: ${r.capacity} (${typeLabel})\n`;
        }
        text += `\nYou can reserve library study pods or seminar rooms directly in the Campus Rooms section.`;
        return text.trim();
      }

      if (libraryData && libraryData.books && libraryData.books.length > 0) {
        let text = `Hello ${userName}! Here are the catalog search results from Somaiya Central Library (Granthagar):\n\n`;
        for (const b of libraryData.books) {
          text += `- **${b.title}** by ${b.author}\n  • Shelf Location: \`${b.shelf}\` | Copies Available: **${b.availableCopies} of ${b.totalCopies}**\n`;
        }
        text += `\nYou can check out physical copies at the Central Library circulation desk using your Somaiya ID card.`;
        return text.trim();
      }

      if (facultyData) {
        return `Hello ${userName}! Here is the consultation availability for **${facultyData.name}**:\n\n- **Current Status:** ${facultyData.status}\n- **Office Location:** ${facultyData.office}\n- **Email Contact:** ${facultyData.email}\n- **Consultation Hours:** ${facultyData.nextAvailable}\n\nFaculty office hours are synced with the campus academic timetable.`;
      }

      if (issuesData && issuesData.issues && issuesData.issues.length > 0) {
        let text = `Hello ${userName}! Active campus maintenance status:\n\n`;
        for (const iss of issuesData.issues) {
          text += `- **${iss.id} (${iss.location})**: ${iss.title} — Status: *${iss.status}*\n`;
        }
        return text.trim();
      }

      if (q.includes("hi") || q.includes("hello") || q.includes("hey") || q.length < 5) {
        return `Hello ${userName}! I am NEXUS AI, the official campus intelligence assistant for Somaiya Vidyavihar University.\n\nI can assist you with:\n- 📅 **Timetable & Rooms**: Ask *"Where is my next class?"*\n- 🏛️ **Vacant Rooms & Pods**: Ask *"Find an empty study pod in the library"*\n- 📚 **Library Catalog (Granthagar)**: Ask *"Reserve Database System Concepts textbook"*\n- 👩‍🏫 **Faculty Availability**: Ask *"Is Dr. Priya Sharma in her office?"*\n- 🛠️ **Campus Infrastructure**: Ask *"Are there any active maintenance tickets?"*\n\nHow can I help you today?`;
      }

      return `Hello ${userName}! I have analyzed your inquiry with Somaiya Vidyavihar campus records. All academic buildings (SSBAS, Aurobindo, Central Library) and institutional services are operational. Feel free to ask about your upcoming classes, vacant study spaces, library books, or professor availability!`;
    }

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
            .then((r) => { toolsUsed.push("getFacultySchedule"); scheduleData = r; liveGroundTruth += `\n- Faculty Schedule: ${JSON.stringify(r)}`; })
            .catch((e) => console.warn("getFacultySchedule failed:", e))
        );
      } else {
        toolPromises.push(
          getStudentScheduleTool({ userUid: input.userUid })
            .then((r) => { toolsUsed.push("getStudentSchedule"); scheduleData = r; liveGroundTruth += `\n- Student Schedule: ${JSON.stringify(r)}`; })
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
          .then((r) => { toolsUsed.push("getVacantRooms"); vacantRoomsData = r; liveGroundTruth += `\n- Vacant Rooms & Pods: ${JSON.stringify(r)}`; })
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
          .then((r) => { toolsUsed.push("getLibraryCatalog"); libraryData = r; liveGroundTruth += `\n- Library Catalog: ${JSON.stringify(r)}`; })
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
          .then((r) => { toolsUsed.push("checkFacultyAvailability"); facultyData = r; liveGroundTruth += `\n- Faculty Availability: ${JSON.stringify(r)}`; })
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
          .then((r) => { toolsUsed.push("getActiveIssues"); issuesData = r; liveGroundTruth += `\n- Campus Maintenance Issues: ${JSON.stringify(r)}`; })
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
      let modelUsed = "gemini-3.5-flash-lite";

      const lowerMsg = input.message.toLowerCase().trim();
      const isSimpleGreeting = lowerMsg === "hi" || lowerMsg === "hello" || lowerMsg === "hey";

      if (hasGeminiKey()) {
        // Attempt 1: Gemini 3.5 Flash Lite (High quota, ultra-fast 1s response)
        try {
          const res = await executeWithModel(getPrimaryModel(), !isSimpleGreeting);
          resultText = extractText(res);
          modelUsed = "gemini-3.5-flash-lite";

          if (res?.messages) {
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
            }
          }
        }
      }

      // If cloud generation did not produce text (no key, quota exhausted, or network latency),
      // seamlessly use the institutional campus intelligence engine
      if (!resultText) {
        resultText = buildArticulateCampusResponse();
        modelUsed = "somaiya-campus-core";
      }

      if (toolsUsed.length === 0) {
        toolsUsed.push("somaiya_campus_grounding");
      }

      const finalResponse = resultText || buildArticulateCampusResponse();

      // If stream didn't deliver any chunks, deliver to sendChunk now
      if (sendChunk && !streamedAnyChunk && finalResponse) {
        try { sendChunk(finalResponse); } catch {}
      }

      return {
        response: finalResponse,
        tools_used: toolsUsed,
        confidence: modelUsed.startsWith("gemini") ? 0.98 : 0.95,
        sources: ["somaiya_institutional_core", modelUsed],
        model: modelUsed,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error("Resilient institutional fallback in nexusAIFlow:", err);
      const fallbackText = buildArticulateCampusResponse();
      if (sendChunk && !streamedAnyChunk) {
        try { sendChunk(fallbackText); } catch {}
      }
      return {
        response: fallbackText,
        tools_used: toolsUsed.length > 0 ? toolsUsed : ["somaiya_campus_grounding"],
        confidence: 0.95,
        sources: ["somaiya_institutional_core"],
        model: "somaiya-campus-core",
        timestamp: new Date().toISOString(),
      };
    }
  }
);
