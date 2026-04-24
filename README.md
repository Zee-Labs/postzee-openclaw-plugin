# Postzee — OpenClaw Plugin

Generate AI images/videos and post to 30+ social media platforms from your OpenClaw agent.

## Installation

```bash
openclaw plugins install @zeelabs/openclaw-postzee
openclaw gateway restart
```

## Configuration

After installing, add your API key to the plugin config:

```json
{
  "plugins": {
    "entries": {
      "postzee": {
        "enabled": true,
        "config": {
          "apiKey": "YOUR_POSTZEE_API_KEY"
        }
      }
    }
  }
}
```

Then restart: `openclaw gateway restart`

## Where to find your API Key

1. Go to [dashboard.postzee.app/settings/account/api](https://dashboard.postzee.app/settings/account/api/)
2. Navigate to **Settings** → **Public API** tab
3. Copy the **API Key** (the first field — click "Reveal" to see the full key)

> **Important:** Copy only the API Key, NOT the MCP URL below it.

## What You Can Do

- **"Generate an image of a cat surfing at sunset"** — creates an AI image
- **"Create a video of coffee being poured"** — generates an AI video
- **"Post this to my Instagram and LinkedIn"** — publishes to connected channels
- **"How many credits do I have?"** — checks your balance

## Available Tools

| Tool | Description |
|------|-------------|
| `postzee_list_channels` | List connected social media channels |
| `postzee_get_credits` | Check AI credit balance |
| `postzee_list_image_models` | List image models with costs |
| `postzee_list_video_models` | List video models with costs |
| `postzee_enhance_prompt` | Optimize prompts for better results |
| `postzee_generate_image` | Generate an AI image |
| `postzee_generate_video` | Generate an AI video |
| `postzee_check_job` | Check generation status |
| `postzee_create_post` | Create/schedule a post |

## Requirements

- [Postzee](https://postzee.app) account with API key
- AI credits for generation
- Connected social media channels (for posting)

## Links

- [Postzee](https://postzee.app) — Platform
- [Dashboard](https://dashboard.postzee.app) — Your account
- [API Key](https://dashboard.postzee.app/settings/account/api/) — Get your key
- [Support](mailto:support@postzee.app) — Help
