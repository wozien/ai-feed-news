"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { briefingDetailQuery, feedTitleMap, feedsQuery } from "@/lib/client/query";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DetailPanel({ id }: { id: string }) {
  const briefing = useQuery(briefingDetailQuery(id));
  const feeds = useQuery(feedsQuery());
  const feedTitles = feedTitleMap(feeds.data);

  const detail = briefing.data;
  const sources = detail
    ? detail.sourceFeedIds.map((feedId) => ({
        id: feedId,
        title: feedTitles[feedId] ?? "已删除的源",
      }))
    : [];

  return (
    <div className="grid gap-4">
      <Button
        variant="ghost"
        className="w-fit"
        nativeButton={false}
        render={<Link href="/briefings" />}
      >
        <ArrowLeft />
        返回历史
      </Button>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-2xl font-semibold tracking-tight">
            <span>{detail?.title ?? "简讯详情"}</span>
            {detail && (
              <span className="text-xs font-normal text-muted-foreground">
                {detail.date}
              </span>
            )}
          </CardTitle>
          {detail ? (
            sources.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {sources.map((source) => (
                  <Badge key={source.id} variant="secondary">
                    {source.title}
                  </Badge>
                ))}
              </div>
            ) : null
          ) : (
            <CardDescription>
              {briefing.isError ? "这条简讯没能读取到，可能已被删除。" : "正在读取已保存的 Markdown"}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {detail ? (
            <MarkdownPreview markdown={detail.markdown} stripLeadingHeading />
          ) : briefing.isError ? (
            <p className="text-sm text-muted-foreground">
              返回历史列表看看其他简讯。
            </p>
          ) : (
            <div className="grid gap-3">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
