# AI Feed News Agent 约定

后续改动必须遵守以下硬约束。产品是个人向「RSS → 大模型 → 每日 AI 简讯」工作台。

## 架构

- 前端：Next.js App Router + Tailwind CSS v4 + shadcn/ui + lucide-react + `next-themes`
- 写路径只走 Route Handlers，业务接口一律 `/api/v1/*`
- **禁止 Server Actions**（`use server`、`action=` 表单提交）
- 认证：Better Auth。唯一入口 `/api/auth/[...all]`
- 数据：Drizzle ORM + Neon PostgreSQL
- 运行时：`/api/*` 固定 `nodejs`，不要改成 `edge`

## 认证

- 服务端：`src/lib/auth.ts`（`drizzleAdapter` + `emailAndPassword` + 可选 GitHub/Google + `nextCookies()` 必须放 plugins 最后）
- 客户端：`src/lib/auth-client.ts` 的 `createAuthClient`
- 业务 API 用 `auth.api.getSession({ headers })` 鉴权，未登录返回 401
- `src/proxy.ts` 只根据 cookie / 路径做门禁，**禁止在 proxy 里查库**

## 数据库

- 运行时用池化 `DATABASE_URL`（hostname 含 `-pooler`）+ `drizzle-orm/neon-serverless` `Pool`
- 迁移用直连 `DATABASE_URL_UNPOOLED`
- Pool 挂 `globalThis`，避免 dev HMR 泄漏连接
- Better Auth 表与业务表在同一 schema 中导出，并完整传给 adapter

## API 形态

成功：`{ "data": ... }`  
失败：`{ "error": { "code": "STRING", "message": "可读中文" } }`

- Body / Query 用 Zod 校验，公共封装在 `src/lib/api/*`
- 页面与客户端组件只 `fetch('/api/v1/...')`，不要直连数据库
- RSS 解析、LLM 调用、密钥加解密只放 `src/lib` 服务端模块

## 大模型与密钥

- 用户在个人中心配置多套 `llm_profiles`，可切换默认档案
- API Key 用 `ENCRYPTION_KEY`（64 位 hex）做 AES-256-GCM
- 接口只回显 `apiKeyHint`，禁止回传明文

## UI

- 设计 token 只写在 `src/app/globals.css`，组件不要写死品牌色 hex
- 图标只用 Lucide，表单必须有可见 label
- Toaster 只挂根 layout
- 生成按钮必须有 loading / disabled，防止重复提交
- 列表加载用 Skeleton；尊重 `prefers-reduced-motion`
- 客户端取数统一走 TanStack Query（`src/lib/client/query.ts` 的 `queryKeys` / `*Query()`），**禁止新增 `useEffect + fetch` 取数**；写操作用 `useMutation` + `setQueryData` / `invalidateQueries` 更新缓存

## 生成规则

- 最多 10 个启用源、每源最多 12 条、默认只取近 24 小时
- 单源失败不阻断；无启用源或无默认模型时返回可操作错误
- Prompt 禁止编造未提供的事实

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
