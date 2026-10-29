import { and, eq } from "drizzle-orm";
import { HttpError, ok, withHandler } from "@/lib/api/http";
import { requireUser } from "@/lib/api/session";
import { parseJson } from "@/lib/api/validate";
import { decryptSecret } from "@/lib/crypto";
import { db } from "@/lib/db";
import { llmProfiles, rssFeeds } from "@/lib/db/schema";
import { generateBriefingMarkdown } from "@/lib/llm/complete";
import { extractTitle } from "@/lib/llm/prompt";
import { parseRssSource } from "@/lib/rss/parse";
import type { GeneratedBriefing, LlmProvider } from "@/lib/types";
import { briefingGenerateSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FEEDS = 10;

export const POST = withHandler(async (request) => {
  const user = await requireUser();
  const body = await parseJson(briefingGenerateSchema, request);

  const [profile] = body.profileId
    ? await db
        .select()
        .from(llmProfiles)
        .where(
          and(
            eq(llmProfiles.userId, user.id),
            eq(llmProfiles.id, body.profileId),
          ),
        )
        .limit(1)
    : await db
        .select()
        .from(llmProfiles)
        .where(and(eq(llmProfiles.userId, user.id), eq(llmProfiles.isDefault, true)))
        .limit(1);

  if (!profile) {
    throw new HttpError(
      "LLM_REQUIRED",
      body.profileId
        ? "所选的大模型档案不存在"
        : "请先在个人中心配置并设为默认的大模型档案",
      body.profileId ? 404 : 409,
    );
  }

  const ownedFeeds = await db
    .select()
    .from(rssFeeds)
    .where(eq(rssFeeds.userId, user.id));

  const selected = body.feedIds?.length
    ? ownedFeeds.filter((feed) => body.feedIds?.includes(feed.id))
    : ownedFeeds.filter((feed) => feed.enabled);

  const feeds = selected.slice(0, MAX_FEEDS);

  if (feeds.length === 0) {
    throw new HttpError("FEED_REQUIRED", "请先添加并启用至少一个 RSS 源", 409);
  }

  const fetched = await Promise.all(
    feeds.map(async (feed) => {
      try {
        const parsed = await parseRssSource(feed.url);
        await db
          .update(rssFeeds)
          .set({
            lastFetchedAt: new Date(),
            lastError: null,
            updatedAt: new Date(),
          })
          .where(eq(rssFeeds.id, feed.id));

        return {
          feed,
          items: parsed.items,
          error: undefined as string | undefined,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "拉取失败";
        await db
          .update(rssFeeds)
          .set({
            lastError: message,
            updatedAt: new Date(),
          })
          .where(eq(rssFeeds.id, feed.id));

        return {
          feed,
          items: [],
          error: message,
        };
      }
    }),
  );

  const usable = fetched.filter((item) => item.items.length > 0);
  if (usable.length === 0) {
    throw new HttpError("EMPTY_FEED", "启用的源近 24 小时没有可用条目", 422);
  }

  const markdown = await generateBriefingMarkdown({
    provider: profile.provider as LlmProvider,
    baseUrl: profile.baseUrl,
    model: profile.model,
    apiKey: decryptSecret(profile.apiKeyEncrypted),
    sources: usable.map((item) => ({
      title: item.feed.title,
      items: item.items,
    })),
  });

  const data: GeneratedBriefing = {
    title: extractTitle(markdown),
    markdown,
    modelUsed: `${profile.name} / ${profile.model}`,
    sourceFeedIds: usable.map((item) => item.feed.id),
    sources: fetched.map((item) => ({
      feedId: item.feed.id,
      title: item.feed.title,
      itemCount: item.items.length,
      error: item.error,
    })),
  };

  return ok(data);
});
