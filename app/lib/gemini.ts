const DEFAULT_MODEL = process.env.DRAFT_MODEL || "gemini-2.5-flash";

function buildGeminiUrl(model: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
}

export async function scoreNote(text: string) {
  const prompt = `
    Evaluate this note for whether it is a strong business or content lead.
    Return valid JSON only with this shape:
    {
      "score": 0-10,
      "status": "accept" | "reject",
      "reason": "short reason",
      "keywords": ["keyword1", "keyword2"]
    }
    Be strict and reject low-signal, vague, or purely personal notes.
    Note text:
    ${text}
  `;

  const res = await fetch(buildGeminiUrl(DEFAULT_MODEL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini scoring failed: ${res.status} ${detail}`);
  }

  const data = await res.json();
  const textOutput = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text).join("") || "{}";
  const parsed = JSON.parse(textOutput || "{}") as {
    score?: number;
    status?: string;
    reason?: string;
    keywords?: string[];
  };

  return {
    score: Number(parsed.score ?? 0),
    status: parsed.status === "accept" ? "accept" : "reject",
    reason: parsed.reason || "No clear signal found.",
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
  };
}

export async function draftNote(text: string, keywords: string[] = []) {
  const prompt = `
    Write a short founder-style draft from the note below.
    Requirements:
    - 120-220 words
    - sound crisp, specific, and founder-led
    - mention concrete detail or numbers if present
    - no hard sales language or fake hype
    - end with: "Reply APPROVE or REJECT to this message"
    Keywords to prioritize: ${keywords.join(", ") || "business signal, customer signal"}
    Note:
    ${text}
  `;

  const res = await fetch(buildGeminiUrl(DEFAULT_MODEL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini drafting failed: ${res.status} ${detail}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text).join("") || "Draft unavailable.";
}
