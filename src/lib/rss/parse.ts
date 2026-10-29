import { parseFeed } from "@rowanmanning/feed-parser";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 2_000_000;
const MAX_ITEMS_PER_FEED = 12;
const LOOKBACK_MS = 24 * 60 * 60 * 1000;
const USER_AGENT = "AiFeedNews/1.0 (+https://github.com/ai-feed-news)";

export type ParsedFeedItem = {
  title: string;
  url: string | null;
  summary: string;
  publishedAt: string | null;
};

export type ParsedFeed = {
  title: string;
  items: ParsedFeedItem[];
};

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchXml(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
        "User-Agent": USER_AGENT,
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`源返回 ${response.status}`);
    }

    const length = Number(response.headers.get("content-length") || 0);
    if (length > MAX_BODY_BYTES) {
      throw new Error("源体积过大");
    }

    const xml = (await response.text()).slice(0, MAX_BODY_BYTES);
    if (!xml.trim()) {
      throw new Error("源内容为空");
    }

    return xml;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("拉取超时");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function pickDate(item: { published: Date | null; updated: Date | null }) {
  return item.published ?? item.updated ?? null;
}

export async function validateRssUrl(url: string) {
  const xml = await fetchXml(url);
  const feed = parseFeed(xml);
  const title = feed.title?.trim() || new URL(url).hostname;

  return {
    title,
    itemCount: feed.items.length,
  };
}

export async function parseRssSource(url: string): Promise<ParsedFeed> {
  const xml = await fetchXml(url);
  const feed = parseFeed(xml);
  const cutoff = Date.now() - LOOKBACK_MS;

  const dated = feed.items
    .map((item) => {
      const date = pickDate(item);
      return {
        title: item.title?.trim() || "未命名条目",
        url: item.url,
        summary: stripHtml(item.description || item.content || "").slice(0, 280),
        publishedAt: date?.toISOString() ?? null,
        timestamp: date?.getTime() ?? 0,
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  const recent = dated.filter((item) => item.timestamp === 0 || item.timestamp >= cutoff);
  const selected = (recent.length > 0 ? recent : dated).slice(0, MAX_ITEMS_PER_FEED);

  return {
    title: feed.title?.trim() || new URL(url).hostname,
    items: selected.map((item) => ({
      title: item.title,
      url: item.url,
      summary: item.summary,
      publishedAt: item.publishedAt,
    })),
  };
}
