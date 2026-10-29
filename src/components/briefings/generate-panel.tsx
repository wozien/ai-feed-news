"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Sparkles } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import {
  briefingDetailQuery,
  feedsQuery,
  llmProfilesQuery,
  queryKeys,
} from "@/lib/client/query";
import type { Briefing, GeneratedBriefing } from "@/lib/types";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

function todayLocal() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function GeneratePanel() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const feeds = useQuery(feedsQuery());
  const profiles = useQuery(llmProfilesQuery());

  const enabledFeeds = useMemo(
    () => (feeds.data ?? []).filter((feed) => feed.enabled),
    [feeds.data],
  );
  const profileList = profiles.data ?? [];

  // 默认档案直接派生，避免数据晚到导致的中间空态
  const [draftProfileId, setDraftProfileId] = useState<string | null>(null);
  const defaultProfile =
    profileList.find((profile) => profile.isDefault) ?? profileList[0];
  const draftExists = profileList.some((profile) => profile.id === draftProfileId);
  const profileId = draftExists ? (draftProfileId ?? "") : (defaultProfile?.id ?? "");
  const selectedProfile = profileList.find((profile) => profile.id === profileId);

  const generateMutation = useMutation({
    mutationFn: () =>
      api<GeneratedBriefing>("/api/v1/briefings/generate", {
        method: "POST",
        body: JSON.stringify({
          feedIds: enabledFeeds.slice(0, 10).map((feed) => feed.id),
          ...(profileId ? { profileId } : {}),
        }),
      }),
    onSuccess: () => {
      toast.success("简讯已生成，可预览后保存");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "生成失败");
    },
  });

  const saveMutation = useMutation({
    mutationFn: (generated: GeneratedBriefing) =>
      api<Briefing>("/api/v1/briefings", {
        method: "POST",
        body: JSON.stringify({
          title: generated.title,
          markdown: generated.markdown,
          date: todayLocal(),
          sourceFeedIds: generated.sourceFeedIds,
          modelUsed: generated.modelUsed,
        }),
      }),
    onSuccess: (saved) => {
      // 详情页直接命中缓存，历史列表后台静默刷新
      queryClient.setQueryData(briefingDetailQuery(saved.id).queryKey, saved);
      void queryClient.invalidateQueries({ queryKey: queryKeys.briefingLists });
      toast.success("已保存到历史简讯");
      router.push(`/briefings/${saved.id}`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "保存失败");
    },
  });

  const loading = feeds.isPending || profiles.isPending;
  const result = generateMutation.data ?? null;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>一键生成</CardTitle>
          <CardDescription>
            拉取已启用 RSS 的近 24 小时条目，交给所选大模型整理成 Markdown。更新频率低的源条目会偏少。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {loading ? (
            <div className="grid gap-3">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          ) : (
            <>
              <div className="rounded-xl border bg-muted/40 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">使用模型</p>
                  {selectedProfile && !selectedProfile.isDefault && (
                    <span className="text-xs text-muted-foreground">非默认档案</span>
                  )}
                </div>
                {profileList.length > 0 ? (
                  <Select
                    value={profileId}
                    onValueChange={(value) => {
                      if (value) setDraftProfileId(value);
                    }}
                    items={profileList.map((profile) => ({
                      value: profile.id,
                      label: `${profile.name} · ${profile.model}`,
                    }))}
                  >
                    <SelectTrigger
                      id="generate-profile"
                      aria-label="选择生成简讯使用的大模型"
                      className="mt-2 w-full bg-background"
                    >
                      <SelectValue placeholder="选择模型档案" />
                    </SelectTrigger>
                    <SelectContent align="start">
                      {profileList.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name} · {profile.model}
                          {profile.isDefault ? "（默认）" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 text-sm">
                    尚未配置。请先到{" "}
                    <Link href="/settings" className="text-primary underline-offset-4 hover:underline">
                      个人中心
                    </Link>{" "}
                    添加模型档案。
                  </p>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs text-muted-foreground">将使用的 RSS 源</p>
                <div className="flex flex-wrap gap-2">
                  {enabledFeeds.length === 0 && (
                    <p className="text-sm">
                      没有启用的源。去{" "}
                      <Link href="/settings" className="text-primary underline-offset-4 hover:underline">
                        个人中心
                      </Link>{" "}
                      添加。
                    </p>
                  )}
                  {enabledFeeds.map((feed) => (
                    <Badge key={feed.id} variant="secondary">
                      {feed.title}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={generateMutation.isPending || !selectedProfile || enabledFeeds.length === 0}
                  onClick={() => generateMutation.mutate()}
                  className="bg-brand-gradient text-white hover:opacity-90"
                >
                  <Sparkles />
                  {generateMutation.isPending ? "生成中..." : "生成今日简讯"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!result || saveMutation.isPending}
                  onClick={() => {
                    if (result) saveMutation.mutate(result);
                  }}
                >
                  <Save />
                  {saveMutation.isPending ? "保存中..." : "保存简讯"}
                </Button>
              </div>
              {result && (
                <div className="grid gap-2">
                  <p className="text-xs text-muted-foreground">
                    源抓取结果（只取近 24 小时，不足的源不补齐）
                  </p>
                  {result.sources.map((source) => (
                    <p key={source.feedId} className="text-sm">
                      {source.title}：
                      {source.error ? (
                        <span className="text-destructive"> {source.error}</span>
                      ) : source.itemCount <= 1 ? (
                        <span className="text-muted-foreground">
                          {" "}
                          近 24 小时仅 {source.itemCount} 条
                        </span>
                      ) : (
                        <span> {source.itemCount} 条</span>
                      )}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="min-h-[480px] rounded-2xl">
        <CardHeader>
          <CardTitle>Markdown 预览</CardTitle>
        </CardHeader>
        <CardContent>
          {generateMutation.isPending ? (
            <div className="grid gap-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ) : (
            <MarkdownPreview markdown={result?.markdown ?? ""} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
