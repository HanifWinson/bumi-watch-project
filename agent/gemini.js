// agent/gemini.js
import dotenv from "dotenv";
dotenv.config();

const MODEL_NAME = "gemini-2.5-flash";

export async function callGemini({ systemPrompt, userMessage, history = [] }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set in .env");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

  // Fix: Gemini requires 'parts' array, not 'content' string
  const formattedHistory = history
    .filter(m => m.role && (m.content || m.parts))
    .map(m => ({
      role:  m.role === "assistant" ? "model" : "user",
      parts: m.parts || [{ text: m.content || "" }],
    }));

  const contents = [
    ...formattedHistory,
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { temperature: 0.3, maxOutputTokens: 2048, topP: 0.8 },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}
