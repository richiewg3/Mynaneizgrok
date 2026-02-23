import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import { saveToHistory, initDb } from "@/lib/db";

const API_KEY = process.env.AI_GATEWAY_API_KEY;

interface PromptInput {
  imageIndex: number;
  description: string;
  imageData?: string;
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

    const userContent: Array<{ type: string; text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    for (const prompt of activePrompts) {
      if (prompt.imageData) {
        const base64Match = prompt.imageData.match(/^data:(image\/\w+);base64,(.+)$/);
        if (base64Match) {
          userContent.push({
            type: "image",
            inlineData: {
              mimeType: base64Match[1],
              data: base64Match[2],
            },
          });
        }
      }
      userContent.push({
        type: "text",
        text: `[Image ${prompt.imageIndex + 1} Description]: ${prompt.description}`,
      });
    }

    userContent.push({
      type: "text",
      text: `Generate ${activePrompts.length} optimized Grok Img2Vid prompt(s), one for each image/description pair above. Label each output clearly.`,
    });

    const geminiPayload = {
      contents: [
        {
          role: "user",
          parts: userContent.map((c) => {
            if (c.type === "image" && c.inlineData) {
              return { inlineData: c.inlineData };
            }
            return { text: c.text };
          }),
        },
      ],
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-05-06:generateContent?key=${API_KEY}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json(
        { error: `AI API returned ${response.status}: ${errorText}` },
        { status: response.status || 500 }
      );
    }

    const data = await response.json();
    const resultText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

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
    return NextResponse.json(
      { error: "Failed to generate prompts. Please try again." },
      { status: 500 }
    );
  }
}
