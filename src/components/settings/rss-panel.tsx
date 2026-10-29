"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { feedsQuery, updateFeedsCache } from "@/lib/client/query";
import type { RssFeed } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function RssPanel() {
  const queryClient = useQueryClient();
  const feeds = useQuery(feedsQuery());

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [editing, setEditing] = useState<RssFeed | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");

  const list = feeds.data ?? [];
  const loading = feeds.isPending;

  const createMutation = useMutation({
    mutationFn: async (input: { title: string; url: string }) => {
      const validated = await api<{ title: string }>("/api/v1/feeds/validate", {
        method: "POST",
        body: JSON.stringify({ url: input.url }),
      });
      return api<RssFeed>("/api/v1/feeds", {
        method: "POST",
        body: JSON.stringify({
          title: input.title || validated.title,
          url: input.url,
          enabled: true,
        }),
      });
    },
    onSuccess: (created) => {
      updateFeedsCache(queryClient, (current) => [created, ...current]);
      setTitle("");
      setUrl("");
      toast.success("已添加 RSS 源");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "添加失败");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (feed: RssFeed) =>
      api<RssFeed>(`/api/v1/feeds/${feed.id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !feed.enabled }),
      }),
    onSuccess: (updated) => {
      updateFeedsCache(queryClient, (current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "更新失败");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (feed: RssFeed) =>
      api<{ id: string }>(`/api/v1/feeds/${feed.id}`, { method: "DELETE" }),
    onSuccess: (_data, feed) => {
      updateFeedsCache(queryClient, (current) =>
        current.filter((item) => item.id !== feed.id),
      );
      toast.success("已删除");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "删除失败");
    },
  });

  const saveEditMutation = useMutation({
    mutationFn: async (input: { feed: RssFeed; title: string; url: string }) => {
      let nextTitle = input.title.trim();
      if (input.url !== input.feed.url) {
        const validated = await api<{ title: string }>("/api/v1/feeds/validate", {
          method: "POST",
          body: JSON.stringify({ url: input.url }),
        });
        if (!nextTitle) nextTitle = validated.title;
      }
      if (!nextTitle) nextTitle = input.feed.title;

      return api<RssFeed>(`/api/v1/feeds/${input.feed.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: nextTitle, url: input.url }),
      });
    },
    onSuccess: (updated) => {
      updateFeedsCache(queryClient, (current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      closeEdit();
      toast.success("已更新 RSS 源");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "保存失败");
    },
  });

  function addFeed(event: React.FormEvent) {
    event.preventDefault();
    createMutation.mutate({ title: title.trim(), url: url.trim() });
  }

  function toggle(feed: RssFeed) {
    toggleMutation.mutate(feed);
  }

  function openEdit(feed: RssFeed) {
    setEditing(feed);
    setEditTitle(feed.title);
    setEditUrl(feed.url);
  }

  function closeEdit() {
    setEditing(null);
    setEditTitle("");
    setEditUrl("");
  }

  function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    saveEditMutation.mutate({
      feed: editing,
      title: editTitle,
      url: editUrl.trim(),
    });
  }

  return (
    <div className="grid gap-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>添加 RSS 源</CardTitle>
          <CardDescription>填写源地址后会先校验，再写入你的个人配置。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[1fr_1.4fr_auto]" onSubmit={addFeed}>
            <div className="grid gap-2">
              <Label htmlFor="feed-title">名称</Label>
              <Input
                id="feed-title"
                placeholder="可选，留空则使用源标题"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feed-url">RSS / Atom URL</Label>
              <Input
                id="feed-url"
                type="url"
                required
                placeholder="https://example.com/feed.xml"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-brand-gradient text-white md:w-auto"
              >
                <Plus />
                {createMutation.isPending ? "校验中..." : "添加"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>已配置的源</CardTitle>
          <CardDescription>最多建议启用 10 个源，生成时只取近 24 小时条目。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {loading && (
            <>
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </>
          )}
          {!loading && list.length === 0 && (
            <p className="text-sm text-muted-foreground">还没有 RSS 源。先添加一个新闻或博客订阅。</p>
          )}
          {list.map((feed) => (
            <div
              key={feed.id}
              className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{feed.title}</p>
                  <Badge variant={feed.enabled ? "secondary" : "outline"}>
                    {feed.enabled ? "已启用" : "已停用"}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{feed.url}</p>
                {feed.lastError && (
                  <p className="mt-1 text-xs text-destructive">{feed.lastError}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={feed.enabled}
                    disabled={
                      toggleMutation.isPending && toggleMutation.variables?.id === feed.id
                    }
                    onCheckedChange={() => toggle(feed)}
                    aria-label={`启用 ${feed.title}`}
                  />
                  <span className="text-xs text-muted-foreground">启用</span>
                </div>
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`编辑 ${feed.title}`}
                    onClick={() => openEdit(feed)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`删除 ${feed.title}`}
                    disabled={
                      removeMutation.isPending && removeMutation.variables?.id === feed.id
                    }
                    onClick={() => removeMutation.mutate(feed)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(open) => (open ? undefined : closeEdit())}>
        <DialogContent>
          <form className="grid gap-4" onSubmit={saveEdit}>
            <DialogHeader>
              <DialogTitle>编辑 RSS 源</DialogTitle>
              <DialogDescription>
                修改名称或地址。地址变化时会先校验，确认可解析后再保存。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="edit-feed-title">名称</Label>
              <Input
                id="edit-feed-title"
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                placeholder="留空则使用源标题"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-feed-url">RSS / Atom URL</Label>
              <Input
                id="edit-feed-url"
                type="url"
                required
                value={editUrl}
                onChange={(event) => setEditUrl(event.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeEdit}
                disabled={saveEditMutation.isPending}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={saveEditMutation.isPending}
                className="bg-brand-gradient text-white"
              >
                {saveEditMutation.isPending ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
