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

  // Generate CV endpoint
  app.post("/api/generate-cv", async (req, res) => {
    const { content, systemInstruction } = req.body;
    try {
      const ai = getGemini();
      if (!ai) {
        return res.status(503).json({ error: "Gemini API key not configured on server" });
      }
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [{ parts: [{ text: content }] }],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });
      res.json({ text: response.text || "" });
    } catch (err: any) {
      console.error("Server generate-cv error:", err?.message || err);
      res.status(500).json({ error: err?.message || "Generation error" });
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
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [{ parts: [{ text: `You are an expert ATS (Applicant Tracking System) analyzer.
Compare the following CV against the provided Job Description.
Calculate a match score out of 100 based on keyword matches, formatting, and relevance.
Provide 3 to 5 actionable tips to improve the CV for this specific job description.

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
      });
      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err: any) {
      console.error("Server ats-score error:", err?.message || err);
      res.status(500).json({ error: err?.message || "ATS analysis error" });
    }
  });

  return app;
}
