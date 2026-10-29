"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import {
  briefingListQuery,
  feedTitleMap,
  feedsQuery,
  queryKeys,
} from "@/lib/client/query";
import type { BriefingSummary } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export function HistoryPanel() {
  const queryClient = useQueryClient();
  const [dateDraft, setDateDraft] = useState("");
  const [date, setDate] = useState("");

  const briefings = useQuery(briefingListQuery(date || undefined));
  const feeds = useQuery(feedsQuery());
  const feedTitles = feedTitleMap(feeds.data);

  const items = briefings.data ?? [];
  const isFirstLoad = briefings.isPending;
  const isRefreshing = briefings.isFetching && !briefings.isPending;

  const removeMutation = useMutation({
    mutationFn: (id: string) => api<{ id: string }>(`/api/v1/briefings/${id}`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      // 已加载的列表都在本地摘掉这条，无需整页重拉
      queryClient.setQueriesData<BriefingSummary[]>(
        { queryKey: queryKeys.briefingLists },
        (current) => current?.filter((row) => row.id !== id),
      );
      queryClient.removeQueries({ queryKey: queryKeys.briefingDetail(id) });
      toast.success("已删除");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "删除失败");
    },
  });

  return (
    <div className="grid gap-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>按日期筛选</CardTitle>
          <CardDescription>按你保存时的本地日历日过滤。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="briefing-date">日期</Label>
            <Input
              id="briefing-date"
              type="date"
              value={dateDraft}
              onChange={(event) => setDateDraft(event.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={isRefreshing}
              onClick={() => setDate(dateDraft)}
            >
              {isRefreshing ? "筛选中..." : "筛选"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDateDraft("");
                setDate("");
              }}
            >
              清除
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {isFirstLoad && (
          <>
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </>
        )}
        {!isFirstLoad && items.length === 0 && (
          <Card className="rounded-2xl">
            <CardContent className="py-8 text-sm text-muted-foreground">
              没有找到简讯。先去生成并保存一条。
            </CardContent>
          </Card>
        )}
        {!isFirstLoad &&
          items.map((item) => (
            <div key={item.id} className="group relative">
              <Link href={`/briefings/${item.id}`} className="block">
                <Card className="rounded-2xl transition-colors duration-200 hover:bg-accent/40">
                  <CardHeader className="pr-14">
                    <CardTitle className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-base">
                      <span>{item.title}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {item.date}
                      </span>
                    </CardTitle>
                    {item.sourceFeedIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.sourceFeedIds.map((feedId) => (
                          <Badge key={feedId} variant="secondary">
                            {feedTitles[feedId] ?? "已删除的源"}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                </Card>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`删除 ${item.title}`}
                disabled={removeMutation.isPending && removeMutation.variables === item.id}
                onClick={() => removeMutation.mutate(item.id)}
                className="absolute top-3.5 right-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
              >
                <Trash2 />
              </Button>
            </div>
          ))}
      </div>
    </div>
  );
}
