import type { ParsedFeedItem } from "@/lib/rss/parse";

export type PromptSource = {
  title: string;
  items: ParsedFeedItem[];
};

export function buildBriefingPrompt(sources: PromptSource[]) {
  const payload = sources
    .map((source, index) => {
      const items = source.items
        .map(
          (item, itemIndex) =>
            `${itemIndex + 1}. ${item.title}\n   时间: ${item.publishedAt ?? "未知"}\n   链接: ${item.url ?? "无"}\n   摘要: ${item.summary || "无"}`,
        )
        .join("\n");
      return `## 源 ${index + 1}: ${source.title}\n${items || "（近 24 小时无条目）"}`;
    })
    .join("\n\n");

  return [
    {
      role: "system" as const,
      content:
        "你是一名冷静、专业的中文资讯主编。只根据用户提供的 RSS 条目撰写每日简讯，禁止编造未提供的事实、数字或链接。若信息不足，明确写“来源未提供”。输出必须是 Markdown，不要包代码围栏。\n" +
        "结构固定且只包含：\n" +
        "# 标题\n" +
        "## 分源摘要\n" +
        "### 源名称\n" +
        "1. 一句话摘要，末尾用该条目的原文链接追加 Markdown 链接：[原文链接](url)\n" +
        "要求：\n" +
        "- 不要输出「今日要点」章节，也不要输出「参考链接」汇总章节\n" +
        "- 每个条目单独成段并以其原文链接结尾，链接必须是该条目「链接」字段给出的 URL，不得改写或编造",
    },
    {
      role: "user" as const,
      content: `请根据以下近 24 小时 RSS 条目生成今日 AI 简讯。\n\n${payload}`,
    },
  ];
}

export function extractTitle(markdown: string, fallback = "每日 AI 简讯") {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || fallback;
}
