import type { NextRequest } from "next/server";

import {
  allSurfaceArtifacts,
  orbitMeta,
  planets,
  probes,
} from "@/lib/data";
import { formatAltitude, formatLatLon } from "@/lib/format";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are the mission librarian of SPACE ARCHIVE, a catalogue of human hardware beyond Earth.
Rules:
1. Answer only from the catalogue context supplied below.
2. If the catalogue does not contain the answer, say so plainly and suggest which catalogue would.
3. Never invent coordinates, dates, statuses or numbers.
4. Distinguish "active" from "mission completed", "contact lost" and "destroyed".
5. Positions are estimates from stored element sets or ephemerides, never live telemetry. Say this when relevant.
6. Keep answers under 180 words and use short paragraphs or a compact list.`;

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

  let body: { question?: string };
  try {
    body = (await request.json()) as { question?: string };
  } catch {
    return Response.json(
      { error: { code: "invalid_json", message: "Request body must be JSON." } },
      { status: 400 },
    );
  }

  const question = body.question?.trim();
  if (!question || question.length < 3) {
    return Response.json(
      { error: { code: "invalid_question", message: "Provide a question of at least 3 characters." } },
      { status: 400 },
    );
  }
  if (question.length > 600) {
    return Response.json(
      { error: { code: "question_too_long", message: "Keep questions under 600 characters." } },
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
          contents: [{ role: "user", parts: [{ text: question }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 450,
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
          temperature: 0.2,
          max_tokens: 450,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "system",
              content: `CATALOGUE CONTEXT\n${buildContext()}`,
            },
            { role: "user", content: question },
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
