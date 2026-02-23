import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import { saveToHistory, initDb } from "@/lib/db";

const API_KEY = process.env.AI_GATEWAY_API_KEY;
const MODEL = process.env.AI_MODEL || "google/gemini-3.1-pro-preview";
const GATEWAY_URL = process.env.AI_GATEWAY_URL || "https://generativelanguage.googleapis.com/v1beta";

interface PromptInput {
  imageIndex: number;
  description: string;
  imageData?: string;
}

async function callGeminiDirect(
  userParts: Array<Record<string, unknown>>,
  modelSlug: string
) {
  const payload = {
    contents: [{ role: "user", parts: userParts }],
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    },
  };

  const url = `${GATEWAY_URL}/models/${modelSlug}:generateContent?key=${API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API returned ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
}

async function callOpenAICompatible(
  userParts: Array<Record<string, unknown>>,
  model: string
) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: userParts.map((part) => {
        if ("inlineData" in part) {
          const inline = part.inlineData as { mimeType: string; data: string };
          return {
            type: "image_url",
            image_url: {
              url: `data:${inline.mimeType};base64,${inline.data}`,
            },
          };
        }
        return { type: "text", text: part.text as string };
      }),
    },
  ];

  const response = await fetch(`${GATEWAY_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API returned ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "No response generated.";
}

export async function POST(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: "API key not configured. Set AI_GATEWAY_API_KEY environment variable." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { prompts, promptCount } = body as {
      prompts: PromptInput[];
      promptCount: number;
    };

    if (!prompts || prompts.length === 0) {
      return NextResponse.json({ error: "No prompts provided" }, { status: 400 });
    }

    const activePrompts = prompts.slice(0, promptCount);

    const userParts: Array<Record<string, unknown>> = [];

    for (const prompt of activePrompts) {
      if (prompt.imageData) {
        const base64Match = prompt.imageData.match(/^data:(image\/\w+);base64,(.+)$/);
        if (base64Match) {
          userParts.push({
            inlineData: {
              mimeType: base64Match[1],
              data: base64Match[2],
            },
          });
        }
      }
      userParts.push({
        text: `[Image ${prompt.imageIndex + 1} Description]: ${prompt.description}`,
      });
    }

    userParts.push({
      text: `Generate ${activePrompts.length} optimized Grok Img2Vid prompt(s), one for each image/description pair above. Label each output clearly.`,
    });

    let resultText: string;

    const isGeminiDirect = GATEWAY_URL.includes("generativelanguage.googleapis.com");
    if (isGeminiDirect) {
      const modelSlug = MODEL.includes("/") ? MODEL.split("/").pop()! : MODEL;
      resultText = await callGeminiDirect(userParts, modelSlug);
    } else {
      resultText = await callOpenAICompatible(userParts, MODEL);
    }

    const results = [{ imageIndex: 0, result: resultText }];

    try {
      await initDb();
      const id = crypto.randomUUID();
      await saveToHistory(id, activePrompts.length, activePrompts, results);
    } catch {
      // DB save is best-effort
    }

    return NextResponse.json({ results: resultText });
  } catch (error) {
    console.error("Generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate prompts.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
