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
      });
      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err: any) {
      console.error("Server ats-score error:", err?.message || err);
      res.status(500).json({ error: err?.message || "ATS analysis error" });
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
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [{ parts: [{ text: `Parse this CV text into a JSON object with these fields: name, email, phone, country, city, linkedin, portfolio, background (a career summary), achievements (array of strings or a single string), skills (array of strings), educations (array of {degree, university}), workExperiences (array of {company, title, startDate, endDate, current, responsibilities (string with bullet points or paragraphs)}), certificates (array of strings), courses (array of strings). Only include information actually present in the text — leave a field empty or omit it rather than inventing data. Ensure all extracted text has perfect grammar and spelling. Return ONLY the JSON object.\n\nCV TEXT:\n${text}` }] }],
        config: { responseMimeType: "application/json" }
      });
      const parsed = JSON.parse(response.text || "{}");
      res.json({ profile: parsed });
    } catch (err: any) {
      console.error("Server parse-cv error:", err?.message || err);
      res.status(500).json({ error: err?.message || "CV parsing error" });
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
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [{
          parts: [
            { inlineData: { data: base64, mimeType: mimeType || "application/pdf" } },
            { text: "Extract all text from this document. Return only the extracted text, no commentary or markdown formatting." }
          ]
        }]
      });
      res.json({ text: response.text || "" });
    } catch (err: any) {
      console.error("Server extract-pdf error:", err?.message || err);
      res.status(500).json({ error: err?.message || "PDF extraction error" });
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
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Extract the job title, company name, and full job description (responsibilities, requirements, skills) from this URL: ${url}. If the page cannot be accessed or does not contain a job posting, say so plainly instead of inventing content.`,
        config: {
          tools: [{ urlContext: {} }]
        }
      });
      res.json({ text: response.text || "" });
    } catch (err: any) {
      console.error("Server extract-url error:", err?.message || err);
      res.status(500).json({ error: err?.message || "URL extraction error" });
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
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Extract all professional information from this LinkedIn profile URL: ${url}. Parse it into a JSON object with these fields: name, email, phone, country, city, linkedin, portfolio, background (a career summary), achievements (array of strings), skills (array of strings), educations (array of {degree, university}), workExperiences (array of {company, title, startDate, endDate, current, responsibilities (string with bullet points or paragraphs)}), certificates (array of strings), courses (array of strings). Only include information actually present on the page — leave fields empty rather than inventing data. Return ONLY the JSON object, no markdown blocks.`,
        config: {
          tools: [{ urlContext: {} }],
          responseMimeType: "application/json"
        }
      });
      const parsed = JSON.parse(response.text || "{}");
      res.json({ profile: parsed });
    } catch (err: any) {
      console.error("Server extract-profile error:", err?.message || err);
      res.status(500).json({ error: err?.message || "Profile extraction error" });
    }
  });

  return app;
}
