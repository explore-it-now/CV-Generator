# Project Instructions & Permanent Guidelines

## 1. Custom Template Duplication
- The user will provide specific CV templates (as PDF, Word .docx, or screenshot/design layouts).
- When provided, duplicate their exact layout, typography, section formatting, margins, colors, and styling for both:
  - The live interactive preview and high-resolution PDF export (via `html2canvas-pro` and `jsPDF`).
  - The editable Word (`.docx`) export (matching fonts, tables/columns, borders, and section headers).

## 2. API Key Privacy & Server-Side Security
- Never expose API keys (such as `GEMINI_API_KEY`) to the client-side browser bundle.
- Route all Gemini AI requests through private server-side Express API routes (`/api/*`) using `process.env.GEMINI_API_KEY`.

## 3. Paywall & Monetization on Download
- When users click "Download", they cannot download until paid.
- Two payment options:
  - **Pay Per Generation**: $3.99 one-time payment for 1 complete CV generation and download pass in all formats (PDF, DOCX, TXT). Supports instant guest checkout without signing up.
  - **Monthly Pro**: $9.99/month for 30 CV generations per month, unlimited downloads, ATS tailoring, and all templates. Supports creating an account or subscribing.
- Guest Checkout: Users can pay without signing up by providing email for their receipt & unlock access.
- Account Sign Up: Users can create an account and subscribe.
- Download enforcement: PDF, Word (.docx), and Plain Text downloads remain locked until payment is verified and confirmed.
