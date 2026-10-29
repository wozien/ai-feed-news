"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { llmProfilesQuery, queryKeys, updateLlmProfilesCache } from "@/lib/client/query";
import type { LlmProfile, LlmProvider } from "@/lib/types";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PROVIDER_PRESETS: Record<LlmProvider, { label: string; baseUrl: string; model: string }> = {
  openai_compatible: {
    label: "OpenAI 兼容",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1-mini",
  },
  anthropic: {
    label: "Anthropic",
    baseUrl: "https://api.anthropic.com",
    model: "claude-sonnet-4-5",
  },
};

export function LlmPanel() {
  const queryClient = useQueryClient();
  const profilesQuery = useQuery(llmProfilesQuery());

  const [name, setName] = useState("");
  const [provider, setProvider] = useState<LlmProvider>("openai_compatible");
  const [baseUrl, setBaseUrl] = useState(PROVIDER_PRESETS.openai_compatible.baseUrl);
  const [model, setModel] = useState(PROVIDER_PRESETS.openai_compatible.model);
  const [apiKey, setApiKey] = useState("");
  const [editing, setEditing] = useState<LlmProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editProvider, setEditProvider] = useState<LlmProvider>("openai_compatible");
  const [editBaseUrl, setEditBaseUrl] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editApiKey, setEditApiKey] = useState("");

  const profiles = profilesQuery.data ?? [];
  const loading = profilesQuery.isPending;

  const createMutation = useMutation({
    mutationFn: (input: {
      name: string;
      provider: LlmProvider;
      baseUrl: string;
      model: string;
      apiKey: string;
    }) =>
      api<LlmProfile>("/api/v1/llm-profiles", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (created) => {
      updateLlmProfilesCache(queryClient, (current) => [
        created,
        ...current.map((item) => (created.isDefault ? { ...item, isDefault: false } : item)),
      ]);
      setName("");
      setApiKey("");
      toast.success("已保存模型档案");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "保存失败");
    },
  });

  const defaultMutation = useMutation({
    mutationFn: (profile: LlmProfile) =>
      api<LlmProfile>(`/api/v1/llm-profiles/${profile.id}/default`, { method: "POST" }),
    onSuccess: (updated) => {
      updateLlmProfilesCache(queryClient, (current) =>
        current.map((item) => ({ ...item, isDefault: item.id === updated.id })),
      );
      toast.success(`已切换到 ${updated.name}`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "切换失败");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (profile: LlmProfile) =>
      api<{ id: string }>(`/api/v1/llm-profiles/${profile.id}`, { method: "DELETE" }),
    onSuccess: (_data, profile) => {
      updateLlmProfilesCache(queryClient, (current) =>
        current.filter((item) => item.id !== profile.id),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.llmProfiles });
      toast.success("已删除");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "删除失败");
    },
  });

  const saveEditMutation = useMutation({
    mutationFn: (input: {
      id: string;
      name: string;
      provider: LlmProvider;
      baseUrl: string;
      model: string;
      apiKey: string;
    }) =>
      api<LlmProfile>(`/api/v1/llm-profiles/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: input.name,
          provider: input.provider,
          baseUrl: input.baseUrl,
          model: input.model,
          ...(input.apiKey ? { apiKey: input.apiKey } : {}),
        }),
      }),
    onSuccess: (updated) => {
      updateLlmProfilesCache(queryClient, (current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      closeEdit();
      toast.success("已更新模型档案");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "保存失败");
    },
  });

  function applyProvider(next: LlmProvider) {
    setProvider(next);
    setBaseUrl(PROVIDER_PRESETS[next].baseUrl);
    setModel(PROVIDER_PRESETS[next].model);
  }

  function createProfile(event: React.FormEvent) {
    event.preventDefault();
    createMutation.mutate({ name, provider, baseUrl, model, apiKey });
  }

  function onDefaultChange(profile: LlmProfile, checked: boolean) {
    if (checked) {
      if (!profile.isDefault) defaultMutation.mutate(profile);
      return;
    }
    toast.info("生成简讯需要默认档案，请改为切换其他档案");
  }

  function openEdit(profile: LlmProfile) {
    setEditing(profile);
    setEditName(profile.name);
    setEditProvider(profile.provider);
    setEditBaseUrl(profile.baseUrl);
    setEditModel(profile.model);
    setEditApiKey("");
  }

  function closeEdit() {
    setEditing(null);
    setEditName("");
    setEditBaseUrl("");
    setEditModel("");
    setEditApiKey("");
  }

  function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    saveEditMutation.mutate({
      id: editing.id,
      name: editName,
      provider: editProvider,
      baseUrl: editBaseUrl,
      model: editModel,
      apiKey: editApiKey.trim(),
    });
  }

  return (
    <div className="grid gap-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>新增模型档案</CardTitle>
          <CardDescription>
            支持 OpenAI 兼容接口（DeepSeek / OpenRouter）和 Anthropic。密钥加密存储，界面只显示末四位。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={createProfile}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="llm-name">档案名称</Label>
                <Input
                  id="llm-name"
                  required
                  placeholder="例如 DeepSeek 日常"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="llm-provider">厂商协议</Label>
                <Select
                  value={provider}
                  onValueChange={(value) => {
                    if (value) applyProvider(value as LlmProvider);
                  }}
                >
                  <SelectTrigger id="llm-provider" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai_compatible">OpenAI 兼容</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="llm-base">Base URL</Label>
                <Input
                  id="llm-base"
                  type="url"
                  required
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="llm-model">模型</Label>
                <Input
                  id="llm-model"
                  required
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="llm-key">API Key</Label>
              <Input
                id="llm-key"
                type="password"
                required
                autoComplete="off"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
              />
            </div>
            <div>
              <Button type="submit" disabled={createMutation.isPending} className="bg-brand-gradient text-white">
                <Plus />
                {createMutation.isPending ? "保存中..." : "保存档案"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>已保存档案</CardTitle>
          <CardDescription>生成简讯时使用默认档案。可随时切换。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {loading && (
            <>
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </>
          )}
          {!loading && profiles.length === 0 && (
            <p className="text-sm text-muted-foreground">还没有模型档案。先添加一个才能生成简讯。</p>
          )}
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex flex-col gap-3 rounded-xl border px-4 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{profile.name}</p>
                  {profile.isDefault && <Badge>默认</Badge>}
                  <Badge variant="outline">
                    {PROVIDER_PRESETS[profile.provider]?.label ?? profile.provider}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {profile.model} · {profile.apiKeyHint}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    size="sm"
                    checked={profile.isDefault}
                    disabled={
                      defaultMutation.isPending && defaultMutation.variables?.id === profile.id
                    }
                    onCheckedChange={(checked) => onDefaultChange(profile, checked)}
                    aria-label={`将 ${profile.name} 设为默认`}
                  />
                  <span className="text-xs text-muted-foreground">默认</span>
                </div>
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`编辑 ${profile.name}`}
                    onClick={() => openEdit(profile)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`删除 ${profile.name}`}
                    disabled={
                      removeMutation.isPending && removeMutation.variables?.id === profile.id
                    }
                    onClick={() => removeMutation.mutate(profile)}
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
              <DialogTitle>编辑模型档案</DialogTitle>
              <DialogDescription>
                API Key 留空则保留原密钥，填写后会覆盖。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-llm-name">档案名称</Label>
                <Input
                  id="edit-llm-name"
                  required
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-llm-provider">厂商协议</Label>
                <Select
                  value={editProvider}
                  onValueChange={(value) => {
                    if (!value) return;
                    const next = value as LlmProvider;
                    setEditProvider(next);
                    setEditBaseUrl(PROVIDER_PRESETS[next].baseUrl);
                    setEditModel(PROVIDER_PRESETS[next].model);
                  }}
                >
                  <SelectTrigger id="edit-llm-provider" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai_compatible">OpenAI 兼容</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-llm-base">Base URL</Label>
                <Input
                  id="edit-llm-base"
                  type="url"
                  required
                  value={editBaseUrl}
                  onChange={(event) => setEditBaseUrl(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-llm-model">模型</Label>
                <Input
                  id="edit-llm-model"
                  required
                  value={editModel}
                  onChange={(event) => setEditModel(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-llm-key">API Key</Label>
                <Input
                  id="edit-llm-key"
                  type="password"
                  autoComplete="off"
                  placeholder={`留空则保留 ${editing?.apiKeyHint ?? ""}`}
                  value={editApiKey}
                  onChange={(event) => setEditApiKey(event.target.value)}
                />
              </div>
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
