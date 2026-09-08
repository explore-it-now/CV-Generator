import { extractFromUrl } from "./src/services/geminiService";

async function run() {
  try {
    const res = await extractFromUrl("https://example.com");
    console.log("Success:", res);
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
