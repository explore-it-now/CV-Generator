import express from "express";
import db from "../lib/db.js";
import { GoogleGenAI } from "@google/genai";

let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: key });
  }
  return geminiClient;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Gemini's SDK throws errors whose .message is a raw JSON blob like
// {"error":{"code":503,"message":"...","status":"UNAVAILABLE"}}. This pulls
// out just the human-readable message so the UI never shows raw JSON.
function cleanGeminiError(err: any): string {
  const raw = err?.message || String(err);
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) return parsed.error.message;
  } catch {}
  return raw;
}

function isTransientGeminiError(err: any): boolean {
  const raw = String(err?.message || err);
  return /"code":\s*503|"code":\s*429|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand|timed out/i.test(raw);
}

// The Vercel function has a hard maxDuration; leave a safety margin so our
// own clean error always gets a chance to send before Vercel force-kills the
// function and the user sees a bare, unhelpful platform timeout instead.
const REQUEST_DEADLINE_MS = 50_000;

// A single Gemini call can occasionally hang far longer than a normal
// response without ever throwing — this bounds how long any one attempt is
// allowed to take, so a stuck call doesn't just sit there until Vercel's
// hard kill fires. Racing a promise doesn't cancel the underlying request,
// but it lets us give up and respond to the client promptly either way.
const ATTEMPT_TIMEOUT_MS = 20_000;
function withAttemptTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    sleep(ATTEMPT_TIMEOUT_MS).then((): never => {
      throw new Error("The AI model took too long to respond (timed out).");
    })
  ]);
}

// Retries a Gemini call for transient "model overloaded" / timeout style
// errors — not for real failures like an invalid API key or a malformed
// request. Stops retrying (rather than blindly trying again) once there's no
// longer enough time left in the request's budget for another attempt.
async function withRetry<T>(fn: () => Promise<T>, deadline: number, attempts = 2): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await withAttemptTimeout(fn());
    } catch (err) {
      lastErr = err;
      const backoff = 500 * Math.pow(2, i); // 500ms, 1000ms, ...
      if (!isTransientGeminiError(err) || i === attempts - 1 || Date.now() + backoff > deadline) {
        throw err;
      }
      await sleep(backoff);
    }
  }
  throw lastErr;
}

export function createApiApp() {
  const app = express();

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: "connected" });
  });

  // Get CV History (Mocking user_id 1 for now until Auth is added)
  app.get("/api/history", (req, res) => {
    try {
      const history = db.prepare("SELECT * FROM cv_history ORDER BY created_at DESC").all();
      res.json(history);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  // Save CV
  app.post("/api/save-cv", (req, res) => {
    const { job_description, optimized_cv, template_id } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO cv_history (user_id, job_description, optimized_cv, template_id)
        VALUES (?, ?, ?, ?)
      `).run(1, job_description, optimized_cv, template_id);

      res.json({ success: true, id: info.lastInsertRowid });
    } catch (err) {
      res.status(500).json({ error: "Failed to save CV" });
    }
  });

  // Generate CV endpoint — streams plain text chunks as they arrive so the UI
  // can show real progress instead of a blind wait. Retries transient
  // "model overloaded" errors before the first byte is sent; once streaming
  // has started we can no longer safely retry, so a mid-stream failure just
  // ends the response with whatever text arrived.
  app.post("/api/generate-cv", async (req, res) => {
    const { content, systemInstruction } = req.body;
    const ai = getGemini();
    if (!ai) {
      return res.status(503).json({ error: "Gemini API key not configured on server" });
    }

    const deadline = Date.now() + REQUEST_DEADLINE_MS;
    let attempt = 0;
    const maxAttempts = 2;
    while (attempt < maxAttempts) {
      attempt++;
      try {
        const stream = await withAttemptTimeout(ai.models.generateContentStream({
          model: "gemini-3.6-flash",
          contents: [{ parts: [{ text: content }] }],
          config: { systemInstruction, temperature: 0.7 }
        }));

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        // Iterate manually (rather than a plain `for await`) so each individual
        // chunk wait is also bounded — a stream that starts but then stalls
        // shouldn't hang any longer than one that never starts at all.
        const iterator = stream[Symbol.asyncIterator]();
        while (true) {
          const { value, done } = await withAttemptTimeout(iterator.next());
          if (done) break;
          const t = value.text;
          if (t) res.write(t);
        }
        res.end();
        return;
      } catch (err: any) {
        console.error(`Server generate-cv error (attempt ${attempt}):`, err?.message || err);
        if (res.headersSent) {
          // Already streaming to the client — can't retry cleanly, just stop.
          res.end();
          return;
        }
        const backoff = 500 * Math.pow(2, attempt - 1);
        if (isTransientGeminiError(err) && attempt < maxAttempts && Date.now() + backoff < deadline) {
          await sleep(backoff);
          continue;
        }
        res.status(503).json({ error: cleanGeminiError(err) });
        return;
      }
    }
  });

  // ATS Score endpoint
  app.post("/api/ats-score", async (req, res) => {
    const { cvText, jobDescription } = req.body;
    try {
      const ai = getGemini();
      if (!ai) {
        return res.status(503).json({ error: "Gemini API key not configured on server" });
      }
      const deadline = Date.now() + REQUEST_DEADLINE_MS;
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [{ parts: [{ text: `You are a strict, realistic ATS (Applicant Tracking System) analyzer. Give an honest assessment — do not inflate the score to be encouraging. A CV that is a poor match for the job description MUST score low (below 50). A CV with no real overlap in role, skills, or seniority should score below 30.
Compare the following CV against the provided Job Description.
Calculate a match score out of 100 based on keyword matches, required skills coverage, seniority alignment, and formatting.
Provide 3 to 5 specific, actionable tips to improve the CV for this specific job description. If the CV is fundamentally misaligned with the role (e.g. wrong field entirely), say so plainly in the tips rather than suggesting minor tweaks.

Respond ONLY with a JSON object in this exact format:
{
  "score": 85,
  "tips": [
    "Include the keyword 'React' more prominently.",
    "Quantify your experience in your last role."
  ]
}

CV TEXT:
${cvText}

JOB DESCRIPTION:
${jobDescription}` }] }],
        config: {
          responseMimeType: "application/json"
        }
      }), deadline);
      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err: any) {
      console.error("Server ats-score error:", err?.message || err);
      res.status(503).json({ error: cleanGeminiError(err) });
    }
  });

  // Parse raw CV text into structured fields (used by "Magic Fill from CV")
  app.post("/api/parse-cv", async (req, res) => {
    const { text } = req.body;
    try {
      const ai = getGemini();
      if (!ai) {
        return res.status(503).json({ error: "Gemini API key not configured on server" });
      }
      const deadline = Date.now() + REQUEST_DEADLINE_MS;
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [{ parts: [{ text: `Parse this CV text into a JSON object with these fields: name, email, phone, country, city, linkedin, portfolio, background (a career summary), achievements (array of strings or a single string), skills (array of strings), educations (array of {degree, university}), workExperiences (array of {company, title, startDate, endDate, current, responsibilities (string with bullet points or paragraphs)}), certificates (array of strings), courses (array of strings). Only include information actually present in the text — leave a field empty or omit it rather than inventing data. Ensure all extracted text has perfect grammar and spelling. Return ONLY the JSON object.\n\nCV TEXT:\n${text}` }] }],
        config: { responseMimeType: "application/json" }
      }), deadline);
      const parsed = JSON.parse(response.text || "{}");
      res.json({ profile: parsed });
    } catch (err: any) {
      console.error("Server parse-cv error:", err?.message || err);
      res.status(503).json({ error: cleanGeminiError(err) });
    }
  });

  // Extract text from an uploaded PDF (used when local text-layer extraction fails, e.g. scanned CVs)
  app.post("/api/extract-pdf", async (req, res) => {
    const { base64, mimeType } = req.body;
    try {
      const ai = getGemini();
      if (!ai) {
        return res.status(503).json({ error: "Gemini API key not configured on server" });
      }
      const deadline = Date.now() + REQUEST_DEADLINE_MS;
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [{
          parts: [
            { inlineData: { data: base64, mimeType: mimeType || "application/pdf" } },
            { text: "Extract all text from this document. Return only the extracted text, no commentary or markdown formatting." }
          ]
        }]
      }), deadline);
      res.json({ text: response.text || "" });
    } catch (err: any) {
      console.error("Server extract-pdf error:", err?.message || err);
      res.status(503).json({ error: cleanGeminiError(err) });
    }
  });

  // Extract a job description from a URL
  app.post("/api/extract-url", async (req, res) => {
    const { url } = req.body;
    try {
      const ai = getGemini();
      if (!ai) {
        return res.status(503).json({ error: "Gemini API key not configured on server" });
      }
      const deadline = Date.now() + REQUEST_DEADLINE_MS;
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Extract the job title, company name, and full job description (responsibilities, requirements, skills) from this URL: ${url}. If the page cannot be accessed or does not contain a job posting, say so plainly instead of inventing content.`,
        config: {
          tools: [{ urlContext: {} }]
        }
      }), deadline);
      res.json({ text: response.text || "" });
    } catch (err: any) {
      console.error("Server extract-url error:", err?.message || err);
      res.status(503).json({ error: cleanGeminiError(err) });
    }
  });

  // Extract a structured profile from a LinkedIn URL
  app.post("/api/extract-profile", async (req, res) => {
    const { url } = req.body;
    try {
      const ai = getGemini();
      if (!ai) {
        return res.status(503).json({ error: "Gemini API key not configured on server" });
      }
      const deadline = Date.now() + REQUEST_DEADLINE_MS;
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Extract all professional information from this LinkedIn profile URL: ${url}. Parse it into a JSON object with these fields: name, email, phone, country, city, linkedin, portfolio, background (a career summary), achievements (array of strings), skills (array of strings), educations (array of {degree, university}), workExperiences (array of {company, title, startDate, endDate, current, responsibilities (string with bullet points or paragraphs)}), certificates (array of strings), courses (array of strings). Only include information actually present on the page — leave fields empty rather than inventing data. Return ONLY the JSON object, no markdown blocks.`,
        config: {
          tools: [{ urlContext: {} }],
          responseMimeType: "application/json"
        }
      }), deadline);
      const parsed = JSON.parse(response.text || "{}");
      res.json({ profile: parsed });
    } catch (err: any) {
      console.error("Server extract-profile error:", err?.message || err);
      res.status(503).json({ error: cleanGeminiError(err) });
    }
  });

  return app;
}
