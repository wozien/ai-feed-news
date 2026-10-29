const HIDDEN_SECTIONS = ["今日要点", "参考链接"];

/**
 * 简讯只保留「分源摘要」。历史数据或模型未按新提示词输出时，
 * 在渲染阶段去掉「今日要点」「参考链接」这类二级章节，避免出现在页面上。
 */
export function stripHiddenSections(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const kept: string[] = [];
  let skipping = false;

  for (const line of lines) {
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const title = heading[2].trim();
      if (level === 2) {
        skipping = HIDDEN_SECTIONS.some((name) => title.includes(name));
        if (skipping) continue;
      } else if (level < 2) {
        skipping = false;
      }
    }

    if (!skipping) kept.push(line);
  }

  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
