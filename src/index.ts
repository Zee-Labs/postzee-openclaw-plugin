import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "@sinclair/typebox";

const API_BASE = "https://api.postzee.app";

/**
 * Helper to call the Postzee MCP-compatible REST API.
 * Uses the API key from plugin config to authenticate.
 */
async function callPostzee(
  apiKey: string,
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: Record<string, unknown>
): Promise<unknown> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Postzee API error (${res.status}): ${text}`);
  }

  return res.json();
}

/**
 * Poll a job until it completes or fails.
 */
async function pollJob(
  apiKey: string,
  jobId: string,
  maxAttempts = 60,
  intervalMs = 5000
): Promise<Record<string, unknown>> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = (await callPostzee(
      apiKey,
      `/public/v1/jobs/${jobId}/status`
    )) as Record<string, unknown>;

    if (result.status === "success" || result.status === "failed") {
      return result;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return { status: "timeout", jobId };
}

export default definePluginEntry({
  id: "postzee",
  name: "Postzee — AI Social Media Studio",

  register(api) {
    // ── List Channels ──
    api.registerTool({
      name: "postzee_list_channels",
      description:
        "List connected social media channels in the user's Postzee account",
      parameters: Type.Object({}),
      async execute(_id, _params, ctx) {
        const apiKey = ctx.config?.apiKey as string;
        if (!apiKey) return { content: [{ type: "text", text: "Error: Postzee API key not configured. Set it in plugin config." }] };

        const data = await callPostzee(apiKey, "/public/v1/integrations");
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    });

    // ── Get Credits ──
    api.registerTool({
      name: "postzee_get_credits",
      description: "Check available AI credit balance",
      parameters: Type.Object({}),
      async execute(_id, _params, ctx) {
        const apiKey = ctx.config?.apiKey as string;
        if (!apiKey) return { content: [{ type: "text", text: "Error: API key not configured." }] };

        const data = await callPostzee(apiKey, "/credits/balance");
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    });

    // ── List Image Models ──
    api.registerTool({
      name: "postzee_list_image_models",
      description: "List available AI image generation models with costs",
      parameters: Type.Object({}),
      async execute(_id, _params, ctx) {
        const apiKey = ctx.config?.apiKey as string;
        if (!apiKey) return { content: [{ type: "text", text: "Error: API key not configured." }] };

        const data = await callPostzee(apiKey, "/public/v1/image-models");
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    });

    // ── List Video Models ──
    api.registerTool({
      name: "postzee_list_video_models",
      description: "List available AI video generation models with costs",
      parameters: Type.Object({}),
      async execute(_id, _params, ctx) {
        const apiKey = ctx.config?.apiKey as string;
        if (!apiKey) return { content: [{ type: "text", text: "Error: API key not configured." }] };

        const data = await callPostzee(apiKey, "/public/v1/video-models");
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    });

    // ── Enhance Prompt ──
    api.registerTool({
      name: "postzee_enhance_prompt",
      description:
        "Optimize a user prompt for dramatically better AI image/video generation results",
      parameters: Type.Object({
        prompt: Type.String({ description: "The user prompt to optimize" }),
        mediaType: Type.Union([Type.Literal("image"), Type.Literal("video")], {
          description: "Type of media the prompt is for",
        }),
        model: Type.Optional(
          Type.String({ description: "Target AI model ID for model-specific optimization" })
        ),
      }),
      async execute(_id, params, ctx) {
        const apiKey = ctx.config?.apiKey as string;
        if (!apiKey) return { content: [{ type: "text", text: "Error: API key not configured." }] };

        const data = await callPostzee(apiKey, "/copilot/enhance-prompt", "POST", {
          prompt: params.prompt,
          mediaType: params.mediaType,
          ...(params.model ? { model: params.model } : {}),
        });
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    });

    // ── Generate Image ──
    api.registerTool({
      name: "postzee_generate_image",
      description:
        "Generate an AI image. Returns a jobId — use postzee_check_job to poll for completion.",
      parameters: Type.Object({
        prompt: Type.String({ description: "Detailed description of the image" }),
        model: Type.String({ description: "Model ID from postzee_list_image_models" }),
      }),
      async execute(_id, params, ctx) {
        const apiKey = ctx.config?.apiKey as string;
        if (!apiKey) return { content: [{ type: "text", text: "Error: API key not configured." }] };

        const data = await callPostzee(apiKey, "/public/v1/generate-image", "POST", {
          prompt: params.prompt,
          model: params.model,
        });
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    });

    // ── Generate Video ──
    api.registerTool({
      name: "postzee_generate_video",
      description:
        "Generate an AI video. Returns a jobId — use postzee_check_job to poll for completion.",
      parameters: Type.Object({
        prompt: Type.String({ description: "Detailed description of the video" }),
        model: Type.String({ description: "Model ID from postzee_list_video_models" }),
        duration: Type.Optional(Type.String({ description: 'Duration in seconds (e.g., "5")' })),
        aspectRatio: Type.Optional(
          Type.String({ description: 'Aspect ratio (e.g., "16:9", "9:16"). Default: "16:9"' })
        ),
      }),
      async execute(_id, params, ctx) {
        const apiKey = ctx.config?.apiKey as string;
        if (!apiKey) return { content: [{ type: "text", text: "Error: API key not configured." }] };

        const data = await callPostzee(apiKey, "/public/v1/generate-video-ai", "POST", {
          prompt: params.prompt,
          model: params.model,
          ...(params.duration ? { duration: params.duration } : {}),
          aspectRatio: params.aspectRatio || "16:9",
        });
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    });

    // ── Check Job ──
    api.registerTool({
      name: "postzee_check_job",
      description: "Check the status of an AI generation job. Poll until status is 'success' or 'failed'.",
      parameters: Type.Object({
        jobId: Type.String({ description: "Job ID from postzee_generate_image or postzee_generate_video" }),
      }),
      async execute(_id, params, ctx) {
        const apiKey = ctx.config?.apiKey as string;
        if (!apiKey) return { content: [{ type: "text", text: "Error: API key not configured." }] };

        const data = await callPostzee(apiKey, `/public/v1/jobs/${params.jobId}/status`);
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    });

    // ── Create Post ──
    api.registerTool({
      name: "postzee_create_post",
      description:
        "Create or schedule a social media post on a connected channel",
      parameters: Type.Object({
        type: Type.Union([Type.Literal("draft"), Type.Literal("schedule")], {
          description: '"schedule" to publish now or at date, "draft" to save',
        }),
        date: Type.String({
          description: 'UTC datetime (e.g., "2026-04-24T15:00:00Z"). Current time for immediate posting.',
        }),
        channelId: Type.String({ description: "Channel ID from postzee_list_channels" }),
        text: Type.String({ description: "Post text content" }),
        mediaUrls: Type.Optional(
          Type.Array(Type.String(), {
            description: "Media URLs to attach (from postzee_check_job result)",
          })
        ),
      }),
      async execute(_id, params, ctx) {
        const apiKey = ctx.config?.apiKey as string;
        if (!apiKey) return { content: [{ type: "text", text: "Error: API key not configured." }] };

        const data = await callPostzee(apiKey, "/public/v1/posts", "POST", {
          date: params.date,
          type: params.type,
          posts: [
            {
              text: params.text,
              images: params.mediaUrls || [],
              integration: { id: params.channelId },
            },
          ],
        });
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    });
  },
});
