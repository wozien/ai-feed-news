import { z } from "zod";

export const feedCreateSchema = z.object({
  title: z.string().trim().min(1, "请填写源名称").max(120),
  url: z.url("请填写合法的 RSS / Atom 地址"),
  enabled: z.boolean().optional(),
});

export const feedUpdateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  url: z.url("请填写合法的 RSS / Atom 地址").optional(),
  enabled: z.boolean().optional(),
});

export const feedValidateSchema = z.object({
  url: z.url("请填写合法的 RSS / Atom 地址"),
});

export const llmCreateSchema = z.object({
  name: z.string().trim().min(1, "请填写档案名称").max(80),
  provider: z.enum(["openai_compatible", "anthropic"]),
  baseUrl: z.url("请填写合法的 Base URL"),
  model: z.string().trim().min(1, "请填写模型名").max(120),
  apiKey: z.string().trim().min(8, "API Key 过短"),
  isDefault: z.boolean().optional(),
});

export const llmUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  provider: z.enum(["openai_compatible", "anthropic"]).optional(),
  baseUrl: z.url("请填写合法的 Base URL").optional(),
  model: z.string().trim().min(1).max(120).optional(),
  apiKey: z.string().trim().min(8).optional(),
  isDefault: z.boolean().optional(),
});

export const briefingGenerateSchema = z.object({
  feedIds: z.array(z.string().min(1)).max(10).optional(),
  profileId: z.string().min(1).optional(),
});

export const briefingSaveSchema = z.object({
  title: z.string().trim().min(1, "请填写标题").max(160),
  markdown: z.string().trim().min(1, "简讯内容为空"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为 YYYY-MM-DD"),
  sourceFeedIds: z.array(z.string()).default([]),
  modelUsed: z.string().trim().min(1),
});

export const briefingListQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为 YYYY-MM-DD")
    .optional(),
});
