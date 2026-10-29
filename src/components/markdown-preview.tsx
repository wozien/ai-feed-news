"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { stripHiddenSections } from "@/lib/markdown";
import { cn } from "@/lib/utils";

export function MarkdownPreview({
  markdown,
  className,
  stripLeadingHeading = false,
}: {
  markdown: string;
  className?: string;
  /** 当标题已由页面单独展示时，去掉 Markdown 开头的一级标题，避免重复。 */
  stripLeadingHeading?: boolean;
}) {
  if (!markdown.trim()) {
    return (
      <p className="text-sm text-muted-foreground">
        生成后将在这里预览 Markdown 简讯。
      </p>
    );
  }

  let content = stripHiddenSections(markdown);
  if (stripLeadingHeading) {
    content = content.replace(/^\s*#\s+.*(?:\r?\n|$)/, "");
  }

  return (
    <div
      className={cn(
        "prose-cn max-w-none text-[15px] leading-7 text-foreground",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 text-2xl font-semibold tracking-tight">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-8 mb-3 text-lg font-semibold tracking-tight">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 mb-2 text-base font-semibold">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-3 text-muted-foreground">{children}</p>,
          ul: ({ children }) => <ul className="mb-4 list-disc space-y-1.5 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1.5 pl-5">{children}</ol>,
          // 列表项之间有空行时，Markdown 会把内容包进 <p>（loose list）；
          // 没有空行时则是裸文本（tight list）。统一颜色与间距，避免同一条简讯里
          // 有的源是灰字、有的源是白字。
          li: ({ children }) => (
            <li className="leading-7 text-muted-foreground [&>p]:mb-0 [&>p]:text-inherit">
              {children}
            </li>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-2 border-primary/40 pl-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded-md bg-muted px-1.5 py-0.5 text-[13px]">{children}</code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
