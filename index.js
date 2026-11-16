import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist");
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") || true }));
app.use(express.json({ limit: "1mb" }));

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "DAXRONE AI" });
});

app.post("/api/chat", async (req, res) => {
  if (!apiKey) {
    return res.status(503).json({ code: "CONFIG_MISSING", error: "Gemini API key is not configured." });
  }

  const { messages, language = "uz" } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ code: "BAD_REQUEST", error: "No messages supplied." });
  }

  const safeMessages = messages.slice(-24).map((m) => ({
    role: m.role === "model" ? "model" : "user",
    parts: [{ text: String(m.text || "").slice(0, 12000) }]
  })).filter((m) => m.parts[0].text.trim());

  if (!safeMessages.length || safeMessages[safeMessages.length - 1].role !== "user") {
    return res.status(400).json({ code: "BAD_REQUEST", error: "Last message must be from the user." });
  }

  const languageNames = {
    uz: "Uzbek", ru: "Russian", en: "English", ar: "Arabic", tr: "Turkish"
  };
  const systemInstruction = `
You are DAXRONE AI, an AI assistant created as the DAXRONE project.
When asked who you are, say you are DAXRONE AI. Do not claim to be Gemini.
When asked who created you, say: "I am DAXRONE AI, created as the DAXRONE project."
Be honest that you are powered by Google's Gemini technology.
Reply in ${languageNames[language] || "Uzbek"} unless the user explicitly requests another language.
Be helpful, clear, and honest. Never claim to be conscious or an independent human.
`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction
    });
    const history = safeMessages.slice(0, -1).map((m) => ({
      role: m.role,
      parts: m.parts
    }));
    const chat = model.startChat({ history });
    const lastText = safeMessages[safeMessages.length - 1].parts[0].text;
    const result = await chat.sendMessage(lastText);
    const answer = result.response.text();
    return res.json({ answer });
  } catch (err) {
    const message = String(err?.message || "");
    const status = Number(err?.status || err?.statusCode || 0);
    const quota = status === 429 || /quota|resource.exhausted|rate.?limit|too many requests/i.test(message);
    if (quota) {
      return res.status(429).json({ code: "QUOTA_EXHAUSTED" });
    }
    console.error("Gemini request failed:", message);
    return res.status(502).json({ code: "UPSTREAM_ERROR", error: "DAXRONE could not reach its AI service." });
  }
});

// Serve the built React/Vite website from the same service in production.
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`DAXRONE API listening on http://localhost:${port}`));
