import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import { saveToHistory, initDb } from "@/lib/db";

const MODEL = process.env.AI_MODEL?.trim() || "google/gemini-3.1-pro-preview";
const DEFAULT_GATEWAY_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_API_HOST = "generativelanguage.googleapis.com";
const API_KEY_ENV_VARS = ["AI_GATEWAY_API_KEY", "GOOGLE_API_KEY", "GEMINI_API_KEY"] as const;

class RouteError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "RouteError";
  }
}

interface PromptInput {
  imageIndex: number;
  description: string;
  imageData?: string;
}

function sanitizeApiKey(value: string): string {
  const trimmed = value.trim();
  const wrappedInQuotes =
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));
  const unquoted = wrappedInQuotes ? trimmed.slice(1, -1).trim() : trimmed;

  if (unquoted.startsWith("Bearer ")) {
    return unquoted.slice("Bearer ".length).trim();
  }

  return unquoted;
}

function resolveApiKey() {
  for (const envVar of API_KEY_ENV_VARS) {
    const candidate = process.env[envVar];
    if (!candidate) {
      continue;
    }

    const apiKey = sanitizeApiKey(candidate);
    if (apiKey) {
      return { apiKey, source: envVar };
    }
  }

  return { apiKey: null, source: null };
}

function resolveGatewayUrl(): string {
  return process.env.AI_GATEWAY_URL?.trim() || DEFAULT_GATEWAY_URL;
}

function isGeminiDirectGateway(gatewayUrl: string): boolean {
  try {
    return new URL(gatewayUrl).host.includes(GEMINI_API_HOST);
  } catch {
    return gatewayUrl.includes(GEMINI_API_HOST);
  }
}

function buildInvalidApiKeyMessage(source: string | null): string {
  const sourceHint = source ? ` from ${source}` : "";
  return `Google rejected the API key${sourceHint}. Use an active Google AI Studio key (usually starts with "AIza"), or set AI_GATEWAY_URL to an OpenAI-compatible endpoint (for example https://openrouter.ai/api/v1) if you are using an "sk-..." key.`;
}

async function callGeminiDirect(
  userParts: Array<Record<string, unknown>>,
  modelSlug: string,
  apiKey: string,
  gatewayUrl: string,
  keySource: string | null
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

  const url = `${gatewayUrl}/models/${modelSlug}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let reason: string | undefined;
    try {
      const parsed = JSON.parse(errorText) as {
        error?: {
          details?: Array<{ reason?: string }>;
        };
      };
      reason = parsed.error?.details?.find((detail) => detail.reason)?.reason;
    } catch {
      // Ignore JSON parse issues and use a generic message below.
    }

    if (response.status === 400 && reason === "API_KEY_INVALID") {
      throw new RouteError(buildInvalidApiKeyMessage(keySource), 400);
    }

    throw new RouteError(`API returned ${response.status}: ${errorText}`, response.status);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
}

async function callOpenAICompatible(
  userParts: Array<Record<string, unknown>>,
  model: string,
  apiKey: string,
  gatewayUrl: string
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

  const response = await fetch(`${gatewayUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
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
    throw new RouteError(`API returned ${response.status}: ${errorText}`, response.status);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "No response generated.";
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey, source } = resolveApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          error: `API key not configured. Set one of: ${API_KEY_ENV_VARS.join(", ")}.`,
        },
        { status: 500 }
      );
    }

    const gatewayUrl = resolveGatewayUrl();
    const geminiDirect = isGeminiDirectGateway(gatewayUrl);
    if (geminiDirect && apiKey.startsWith("sk-")) {
      return NextResponse.json(
        { error: buildInvalidApiKeyMessage(source) },
        { status: 400 }
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

    if (geminiDirect) {
      const modelSlug = MODEL.includes("/") ? MODEL.split("/").pop()! : MODEL;
      resultText = await callGeminiDirect(userParts, modelSlug, apiKey, gatewayUrl, source);
    } else {
      resultText = await callOpenAICompatible(userParts, MODEL, apiKey, gatewayUrl);
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
    const status = error instanceof RouteError ? error.status : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
