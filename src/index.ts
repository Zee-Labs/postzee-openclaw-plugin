import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "@sinclair/typebox";

const API_BASE = "https://api.postzee.app";

/**
 * Call the Postzee Public API.
 * Auth via API key in the Authorization header.
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

/** Helper: extract API key from plugin config or return error content */
function getApiKey(ctx: any): { key: string } | { error: any } {
  const apiKey = ctx.config?.apiKey;
  if (!apiKey) {
    return {
      error: {
        details: null,
        content: [{ type: "text", text: "Error: Postzee API key not configured. Set it in plugin config (Settings → Plugins → postzee → apiKey)." }],
      },
    };
  }
  return { key: apiKey };
}

export default definePluginEntry({
  id: "postzee",
  name: "Postzee — AI Social Media Studio",
  description: "Generate AI images/videos and post to 30+ social media platforms",

  register(api) {
    // ── List Channels ──
    api.registerTool({
      name: "postzee_list_channels",
      label: "List Channels",
      description: "List connected social media channels in the user's Postzee account",
      parameters: Type.Object({}),
      async execute(_id: string, _params: any, ctx: any) {
        const auth = getApiKey(ctx);
        if ("error" in auth) return auth.error;
        const data = await callPostzee(auth.key, "/public/v1/integrations");
        return { details: null, content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    });

    // ── Get Credits ──
    api.registerTool({
      name: "postzee_get_credits",
      label: "Get Credits",
      description: "Check available AI credit balance",
      parameters: Type.Object({}),
      async execute(_id: string, _params: any, ctx: any) {
        const auth = getApiKey(ctx);
        if ("error" in auth) return auth.error;
        // Public API: use copilot credits endpoint (accepts API key auth)
        const data = await callPostzee(auth.key, "/copilot/credits");
        return { details: null, content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    });

    // ── List Image Models ──
    api.registerTool({
      name: "postzee_list_image_models",
      label: "List Image Models",
      description: "List available AI image generation models with costs",
      parameters: Type.Object({}),
      async execute(_id: string, _params: any, ctx: any) {
        const auth = getApiKey(ctx);
        if ("error" in auth) return auth.error;
        const data = await callPostzee(auth.key, "/public/v1/image-models");
        return { details: null, content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    });

    // ── List Video Models ──
    api.registerTool({
      name: "postzee_list_video_models",
      label: "List Video Models",
      description: "List available AI video generation models with costs",
      parameters: Type.Object({}),
      async execute(_id: string, _params: any, ctx: any) {
        const auth = getApiKey(ctx);
        if ("error" in auth) return auth.error;
        const data = await callPostzee(auth.key, "/public/v1/video-models");
        return { details: null, content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    });

    // ── Enhance Prompt ──
    api.registerTool({
      name: "postzee_enhance_prompt",
      label: "Enhance Prompt",
      description: "Optimize a user prompt for dramatically better AI image/video generation results",
      parameters: Type.Object({
        prompt: Type.String({ description: "The user prompt to optimize" }),
        mediaType: Type.Union([Type.Literal("image"), Type.Literal("video")], {
          description: "Type of media the prompt is for",
        }),
        model: Type.Optional(
          Type.String({ description: "Target AI model ID for model-specific optimization" })
        ),
      }),
      async execute(_id: string, params: any, ctx: any) {
        const auth = getApiKey(ctx);
        if ("error" in auth) return auth.error;
        const data = await callPostzee(auth.key, "/copilot/enhance-prompt", "POST", {
          prompt: params.prompt,
          mediaType: params.mediaType,
          ...(params.model ? { model: params.model } : {}),
        });
        return { details: null, content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    });

    // ── Generate Image ──
    api.registerTool({
      name: "postzee_generate_image",
      label: "Generate Image",
      description: "Generate an AI image. Returns a jobId — use postzee_check_job to poll for completion.",
      parameters: Type.Object({
        prompt: Type.String({ description: "Detailed description of the image" }),
        model: Type.String({ description: "Model ID from postzee_list_image_models" }),
      }),
      async execute(_id: string, params: any, ctx: any) {
        const auth = getApiKey(ctx);
        if ("error" in auth) return auth.error;
        const data = await callPostzee(auth.key, "/public/v1/generate-image", "POST", {
          prompt: params.prompt,
          model: params.model,
        });
        return { details: null, content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    });

    // ── Generate Video ──
    api.registerTool({
      name: "postzee_generate_video",
      label: "Generate Video",
      description: "Generate an AI video. Returns a jobId — use postzee_check_job to poll for completion.",
      parameters: Type.Object({
        prompt: Type.String({ description: "Detailed description of the video" }),
        model: Type.String({ description: "Model ID from postzee_list_video_models" }),
        duration: Type.Optional(Type.String({ description: 'Duration in seconds (e.g., "5")' })),
        aspectRatio: Type.Optional(
          Type.String({ description: 'Aspect ratio (e.g., "16:9", "9:16"). Default: "16:9"' })
        ),
      }),
      async execute(_id: string, params: any, ctx: any) {
        const auth = getApiKey(ctx);
        if ("error" in auth) return auth.error;
        const data = await callPostzee(auth.key, "/public/v1/generate-video-ai", "POST", {
          prompt: params.prompt,
          model: params.model,
          ...(params.duration ? { duration: params.duration } : {}),
          aspectRatio: params.aspectRatio || "16:9",
        });
        return { details: null, content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    });

    // ── Check Job ──
    api.registerTool({
      name: "postzee_check_job",
      label: "Check Job Status",
      description: "Check the status of an AI generation job. Poll until status is 'success' or 'failed'.",
      parameters: Type.Object({
        jobId: Type.String({ description: "Job ID from postzee_generate_image or postzee_generate_video" }),
      }),
      async execute(_id: string, params: any, ctx: any) {
        const auth = getApiKey(ctx);
        if ("error" in auth) return auth.error;
        const data = await callPostzee(auth.key, `/public/v1/jobs/${params.jobId}/status`);
        return { details: null, content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    });

    // ── Create Post ──
    api.registerTool({
      name: "postzee_create_post",
      label: "Create Post",
      description: "Create or schedule a social media post on a connected channel",
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
      async execute(_id: string, params: any, ctx: any) {
        const auth = getApiKey(ctx);
        if ("error" in auth) return auth.error;
        const data = await callPostzee(auth.key, "/public/v1/posts", "POST", {
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
        return { details: null, content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    });
  },
});
