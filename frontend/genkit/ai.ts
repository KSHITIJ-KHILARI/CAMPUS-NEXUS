import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { ollama } from "genkitx-ollama";

const geminiKey =
  process.env.GEMINI_API_KEY ||
  process.env.NEXUS_API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  "";

const rawOllamaUrl =
  process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const ollamaBaseUrl = rawOllamaUrl.replace("localhost", "127.0.0.1");

const plugins: any[] = [
  ollama({
    serverAddress: ollamaBaseUrl,
    models: [
      { name: "gemma4:latest" },
      { name: "gemma4:e2b" },
      { name: "gemma4:e4b" },
      { name: "qwen3.5:4b" },
    ],
  }),
];

if (geminiKey && geminiKey !== "PASTE_KEY_HERE") {
  plugins.push(googleAI({ apiKey: geminiKey }));
}

export const ai = genkit({
  plugins,
});

export function hasGeminiKey(): boolean {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.NEXUS_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    "";
  return !!key && key !== "PASTE_KEY_HERE";
}

export function getPrimaryModel() {
  if (hasGeminiKey()) {
    return googleAI.model("gemini-3.5-flash-lite");
  }
  return "ollama/gemma4:latest";
}

export function getFallbackModel() {
  if (hasGeminiKey()) {
    return googleAI.model("gemini-3.5-flash");
  }
  return "ollama/gemma4:latest";
}

export function getTertiaryModel() {
  if (hasGeminiKey()) {
    return googleAI.model("gemini-3.6-flash");
  }
  return "ollama/gemma4:latest";
}
