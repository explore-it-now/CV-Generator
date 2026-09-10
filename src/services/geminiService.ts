// All AI operations go through the server's /api routes, which hold the
// Gemini API key securely (see src/server/app.ts). On failure these throw
// a real error instead of silently returning fabricated content — callers
// are responsible for surfacing that error to the user honestly.

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request to ${path} failed (${res.status})`);
  }
  return data;
}

export const extractTextFromPDF = async (base64: string, mimeType: string): Promise<string> => {
  const data = await postJson<{ text?: string }>("/api/extract-pdf", { base64, mimeType });
  if (!data.text) throw new Error("No text could be extracted from this file.");
  return data.text;
};

// Streams the generated CV as it's written, calling onChunk with the
// accumulated text so far after each piece arrives — this is what powers the
// real (not simulated) progress feedback during generation.
export const generateCV = async (
  content: string,
  systemInstruction: string,
  onChunk?: (accumulatedText: string) => void
): Promise<string> => {
  const res = await fetch("/api/generate-cv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, systemInstruction })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || `Generation request failed (${res.status})`);
  }
  if (!res.body) {
    // Fallback for environments without streaming body support
    const text = await res.text();
    if (!text) throw new Error("The AI did not return any content. Please try again.");
    return text.replace(/^```[\w]*\n/gm, '').replace(/```$/gm, '');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onChunk?.(full);
  }
  if (!full) throw new Error("The AI did not return any content. Please try again.");
  return full.replace(/^```[\w]*\n/gm, '').replace(/```$/gm, '');
};

export const extractFromUrl = async (url: string): Promise<string> => {
  const data = await postJson<{ text?: string }>("/api/extract-url", { url });
  if (!data.text) throw new Error("Could not extract a job description from that URL.");
  return data.text;
};

export const parseCV = async (text: string): Promise<Record<string, unknown>> => {
  const data = await postJson<{ profile?: Record<string, unknown> }>("/api/parse-cv", { text });
  if (!data.profile) throw new Error("Could not parse any details from this CV.");
  return data.profile;
};

export const extractProfileFromUrl = async (url: string): Promise<string> => {
  const data = await postJson<{ profile?: unknown }>("/api/extract-profile", { url });
  if (!data.profile) throw new Error("Could not extract a profile from that LinkedIn URL.");
  return JSON.stringify(data.profile);
};

export const analyzeAtsCompatibility = async (
  cvText: string,
  jobDescription: string
): Promise<{ score: number; tips: string[] }> => {
  const data = await postJson<{ score?: number; tips?: string[] }>("/api/ats-score", { cvText, jobDescription });
  if (typeof data.score !== "number") throw new Error("ATS analysis did not return a valid score.");
  return { score: data.score, tips: data.tips || [] };
};
