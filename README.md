# AI Feed News

**English** · [中文](README.zh-CN.md)

Turn scattered RSS feeds into one calm, readable daily briefing—summarized by the AI model you choose, previewed in Markdown, and saved when you are ready.

**Live app:** [ai-feed-news.vercel.app](https://ai-feed-news.vercel.app)

![Daily briefing: generate from RSS sources and preview Markdown](docs/img/ai-feed-news-snapshot-01.png)

## What it is

AI Feed News is a personal workspace for **RSS → AI → daily digest**. You connect the sites you already follow, pick a default model profile, and generate a structured briefing on demand. Nothing runs on a schedule unless you click generate; you always review before saving.

It is built for one person at a time: your feeds, your models, your history—no public feed directory or shared timeline.

## Who it is for

- Readers who subscribe to many RSS/Atom sources and want **one place** to catch up
- People who want **their own** LLM (OpenAI-compatible or Anthropic-style APIs) without a black-box news app
- Anyone who prefers **Markdown output** they can skim, edit, or archive

## How to use

1. **Sign up or sign in** (email and password; GitHub or Google if enabled on the instance).
2. **Open Settings** and add RSS feed URLs. Enable the sources you want in today’s run (up to 10 active feeds).
3. **Add at least one model profile** in Settings—provider, base URL, model name, and API key—and mark one as default.
4. **Go to Daily briefing** (`/`). Confirm the default model and enabled feeds, then click **Generate today’s briefing**.
5. **Review the Markdown preview** on the right. When it looks good, **Save** to store it under your account.
6. **Browse History** (`/briefings`) to filter by date and open past briefings.

### What generation does

- Pulls recent items from your **enabled** feeds (typically the last 24 hours, with sensible fallbacks when dates are missing).
- Sends that material to your **default model** and returns a structured Chinese Markdown digest grouped by source, with links back to originals.
- If a single feed fails, others still run; the app surfaces errors so you can fix URLs or retry.

### Tips

- Start with a few trusted feeds before adding more.
- Use **Preview first, save second** so you do not clutter history with drafts.
- Keep one default model profile to avoid surprises on the daily page.
