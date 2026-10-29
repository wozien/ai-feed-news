import { keepPreviousData, queryOptions, type QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/client/api";
import type { Briefing, BriefingSummary, LlmProfile, RssFeed } from "@/lib/types";

/**
 * 全局 query key 约定。所有取数必须走这里，避免各处手拼字符串导致缓存命中不到。
 */
export const queryKeys = {
  feeds: ["feeds"] as const,
  llmProfiles: ["llm-profiles"] as const,
  briefingList: (date?: string) => ["briefings", "list", date || "all"] as const,
  briefingLists: ["briefings", "list"] as const,
  briefingDetail: (id: string) => ["briefings", "detail", id] as const,
};

export const feedsQuery = () =>
  queryOptions({
    queryKey: queryKeys.feeds,
    queryFn: () => api<RssFeed[]>("/api/v1/feeds"),
  });

export const llmProfilesQuery = () =>
  queryOptions({
    queryKey: queryKeys.llmProfiles,
    queryFn: () => api<LlmProfile[]>("/api/v1/llm-profiles"),
  });

export const briefingListQuery = (date?: string) =>
  queryOptions({
    queryKey: queryKeys.briefingList(date),
    queryFn: () =>
      api<BriefingSummary[]>(
        date ? `/api/v1/briefings?date=${encodeURIComponent(date)}` : "/api/v1/briefings",
      ),
    // 切换日期筛选时保留上一份列表，避免整片 Skeleton 闪烁
    placeholderData: keepPreviousData,
  });

export const briefingDetailQuery = (id: string) =>
  queryOptions({
    queryKey: queryKeys.briefingDetail(id),
    queryFn: () => api<Briefing>(`/api/v1/briefings/${id}`),
    // 已保存的简讯不可变，无需重复请求
    staleTime: Infinity,
  });

export function updateFeedsCache(
  queryClient: QueryClient,
  updater: (feeds: RssFeed[]) => RssFeed[],
) {
  queryClient.setQueryData<RssFeed[]>(queryKeys.feeds, (current) =>
    current ? updater(current) : current,
  );
}

export function updateLlmProfilesCache(
  queryClient: QueryClient,
  updater: (profiles: LlmProfile[]) => LlmProfile[],
) {
  queryClient.setQueryData<LlmProfile[]>(queryKeys.llmProfiles, (current) =>
    current ? updater(current) : current,
  );
}

export function feedTitleMap(feeds: RssFeed[] | undefined) {
  return Object.fromEntries((feeds ?? []).map((feed) => [feed.id, feed.title]));
}
