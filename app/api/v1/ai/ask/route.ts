import type { NextRequest } from "next/server";

import {
  allSurfaceArtifacts,
  orbitMeta,
  planets,
  probes,
} from "@/lib/data";
import { formatAltitude, formatLatLon } from "@/lib/format";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are the Cosmic AI Assistant for SPACE ARCHIVE — an interactive 3D digital atlas of humanity's hardware and missions in space (satellites, lunar and Martian rovers, landers, deep space probes, orbits, planets).

Guidelines:
1. Always respond in the same language the user asks in (O'zbek, English, Russian, etc.).
2. You have comprehensive knowledge of space exploration, NASA, ESA, SpaceX, Roscosmos, Apollo missions, Voyager 1 & 2, Perseverance, Curiosity, James Webb, ISS, satellites, and solar system science.
3. Ground your answers in the verified CATALOGUE CONTEXT below whenever relevant.
4. Be friendly, accurate, and concise. Format responses with clear paragraphs, bold terms, or neat bullet points.
5. If asked about live tracking, explain that positions come from published orbital element propagation (SGP4) and JPL Horizons ephemerides snapshots.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function buildContext(): string {
  const orbitSample = [...allSurfaceArtifacts]
    .slice(0, 60)
    .map(
      (a) =>
        `${a.name} | ${a.category} | ${a.mission} | ${a.agency} | launched ${a.launchDate ?? "unknown"} | ${
          a.location.status === "verified_located"
            ? `${formatLatLon(a.location.latitude, a.location.longitude)} (±${a.location.accuracy})`
            : "UNKNOWN LOCATION"
        }`,
    )
    .join("\n");

  const probeLines = probes
    .map(
      (p) =>
        `${p.name} | launched ${p.launchDate} | status ${p.status} | ${p.distanceAu.toFixed(
          3,
        )} AU from the Sun at epoch ${p.epoch}`,
    )
    .join("\n");

  const planetLines = planets
    .map((p) => `${p.name} | ${p.distanceAu.toFixed(3)} AU | epoch ${p.epoch}`)
    .join("\n");

  return `EARTH ORBIT SNAPSHOT
${orbitMeta.objectCount} catalogued objects (satellites, rocket bodies, debris).
Source: CelesTrak GP + SATCAT, retrieved ${orbitMeta.retrievedAt}.
Element epochs: ${orbitMeta.elementEpochRange.min} to ${orbitMeta.elementEpochRange.max}.
Positions are SGP4 propagations, not live tracking.

SURFACE CATALOGUE (sample of ${allSurfaceArtifacts.length} records)
${orbitSample}

DEEP-SPACE PROBES
${probeLines}

PLANETS (JPL Horizons ICRF, epoch ${planets[0]?.epoch ?? "unknown"})
${planetLines}`;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error: {
          code: "assistant_not_configured",
          message:
            "The mission librarian is optional and is not configured on this deployment.",
          hint:
            "Set LLM_API_KEY (and optionally LLM_BASE_URL, LLM_MODEL) in the Vercel project environment variables to enable it. The rest of the archive works without it.",
        },
      },
      { status: 503 },
    );
  }

  let body: { question?: string; messages?: ChatMessage[] };
  try {
    body = (await request.json()) as {
      question?: string;
      messages?: ChatMessage[];
    };
  } catch {
    return Response.json(
      { error: { code: "invalid_json", message: "Request body must be JSON." } },
      { status: 400 },
    );
  }

  // Normalize conversation history
  let conversation: ChatMessage[] = [];
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    conversation = body.messages
      .filter((m) => m && typeof m.content === "string" && m.content.trim().length > 0)
      .slice(-8);
  } else if (body.question && body.question.trim().length >= 2) {
    conversation = [{ role: "user", content: body.question.trim() }];
  }

  if (conversation.length === 0) {
    return Response.json(
      { error: { code: "invalid_question", message: "Provide a question or messages." } },
      { status: 400 },
    );
  }

  const isGemini =
    apiKey.startsWith("AQ.") ||
    apiKey.startsWith("AIza") ||
    process.env.LLM_PROVIDER === "gemini";
  const baseUrl = (
    process.env.LLM_BASE_URL ??
    (isGemini
      ? "https://generativelanguage.googleapis.com/v1beta"
      : "https://api.openai.com/v1")
  ).replace(/\/$/, "");
  const model =
    process.env.LLM_MODEL ?? (isGemini ? "gemini-flash-lite-latest" : "gpt-4o-mini");
  const timeoutMs = Number.parseInt(process.env.LLM_TIMEOUT_MS ?? "45000", 10);

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number.isFinite(timeoutMs) ? timeoutMs : 45_000,
  );

  try {
    let answer = "";

    if (isGemini) {
      const contents = conversation.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const geminiUrl = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(geminiUrl, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\nCATALOGUE CONTEXT\n${buildContext()}`,
              },
            ],
          },
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 600,
          },
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        return Response.json(
          {
            error: {
              code: "upstream_error",
              message: `The language model provider returned ${response.status}.`,
              detail: detail.slice(0, 400),
            },
          },
          { status: 502 },
        );
      }

      const payload = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      answer = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    } else {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          max_tokens: 600,
          messages: [
            {
              role: "system",
              content: `${SYSTEM_PROMPT}\n\nCATALOGUE CONTEXT\n${buildContext()}`,
            },
            ...conversation.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        return Response.json(
          {
            error: {
              code: "upstream_error",
              message: `The language model provider returned ${response.status}.`,
              detail: detail.slice(0, 400),
            },
          },
          { status: 502 },
        );
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: unknown;
      };
      answer = payload.choices?.[0]?.message?.content?.trim() ?? "";
    }

    if (!answer) {
      return Response.json(
        {
          error: {
            code: "empty_answer",
            message: "The provider returned an empty answer.",
          },
        },
        { status: 502 },
      );
    }

    return Response.json({
      answer,
      model,
      groundedIn: "Bundled SPACE ARCHIVE catalogue snapshot",
      disclaimer:
        "Generated from the bundled catalogue. Verify critical details against the linked source records.",
    });
  } catch (error) {
    const aborted = (error as Error).name === "AbortError";
    return Response.json(
      {
        error: {
          code: aborted ? "upstream_timeout" : "upstream_unreachable",
          message: aborted
            ? "The language model did not answer in time."
            : "Could not reach the language model provider.",
        },
      },
      { status: 504 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  return Response.json({
    endpoint: "POST /api/v1/ai/ask",
    body: { question: "string" },
    configured: Boolean(process.env.LLM_API_KEY),
    note: "Optional OpenAI-compatible assistant. Returns 503 when not configured.",
  });
}
