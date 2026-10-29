# AI Feed News 功能设计

## 产品目标

让个人用户把分散的 RSS 订阅收成一篇结构化的中文日报。生成由用户手动触发，结果先预览再保存。

## 角色

MVP 只有登录用户，数据按 `userId` 隔离。没有管理员后台、没有公开订阅广场。

## 页面

| 路径                 | 说明                                                     |
| -------------------- | -------------------------------------------------------- |
| `/login` `/register` | 邮箱注册登录；若配置了环境变量则显示 GitHub / Google     |
| `/`                  | 今日简讯：查看将使用的源与默认模型，一键生成、预览、保存 |
| `/briefings`         | 历史简讯列表，支持 `YYYY-MM-DD` 筛选                     |
| `/briefings/:id`     | 已保存简讯的 Markdown 预览                               |
| `/settings`          | 个人中心：RSS、大模型档案、基础资料                      |

未登录访问受保护路径时，`src/proxy.ts` 跳到 `/login?next=...`。

## 数据表

Better Auth：`user`、`session`、`account`、`verification`。

业务表：

- `rss_feeds`：源名称、URL、启用状态、上次抓取时间与错误
- `llm_profiles`：厂商协议（`openai_compatible` / `anthropic`）、Base URL、模型、加密 API Key、是否默认
- `briefings`：本地日历日、标题、Markdown、源 ID 列表、所用模型

## REST API

除 `/api/auth/*` 与 `GET /api/v1/auth-options` 外，均需登录。

### RSS

- `GET /api/v1/feeds`
- `POST /api/v1/feeds` `{ title, url, enabled? }`
- `PATCH /api/v1/feeds/:id`
- `DELETE /api/v1/feeds/:id`
- `POST /api/v1/feeds/validate` `{ url }` → `{ title, itemCount }`

### 大模型

- `GET /api/v1/llm-profiles`（只回 `apiKeyHint`）
- `POST /api/v1/llm-profiles`
- `PATCH /api/v1/llm-profiles/:id`
- `DELETE /api/v1/llm-profiles/:id`
- `POST /api/v1/llm-profiles/:id/default`

首个档案自动成为默认。删除默认档案时，会把剩余第一条提升为默认。

### 简讯

- `POST /api/v1/briefings/generate` `{ feedIds? }` → 预览对象，不落库
- `GET /api/v1/briefings?date=YYYY-MM-DD`
- `POST /api/v1/briefings` 保存
- `GET /api/v1/briefings/:id`

统一响应：`{ data }` 或 `{ error: { code, message } }`。

## 生成规则

1. 读取默认 `llm_profile` 与启用（或指定）的 RSS
2. 并发拉取，超时 10s，体积上限约 2MB
3. 每源最多 12 条；优先近 24 小时。若条目全部无时间，则退回最新 12 条
4. 单源失败写入 `lastError`，不中断其他源
5. 将条目交给所选模型，产出固定结构的中文 Markdown：标题 + 分源摘要；每条摘要末尾附「原文链接」指向该条目原文。不输出「今日要点」与「参考链接」汇总章节
6. 禁止编造未提供的事实；信息不足时写「来源未提供」

约束：最多 10 个启用源；生成路由 `maxDuration = 60`。

## 错误态

| 场景               | 行为                            |
| ------------------ | ------------------------------- |
| 未登录             | 401，前端跳转登录               |
| 无启用源           | `FEED_REQUIRED`，引导去个人中心 |
| 无默认模型         | `LLM_REQUIRED`，引导去个人中心  |
| 源全部失败或无条目 | `EMPTY_FEED`                    |
| 模型接口失败       | `LLM_ERROR`                     |
| RSS 无法解析       | `INVALID_FEED`                  |

## MVP 边界

不做：邮件验证、定时任务、多日合并、协作共享、RSS 条目持久化、计费。

## 后续可做

- 邮件验证与找回密码
- Cron 每日自动生成
- 源分类 / 标签
- 简讯导出与分享链接
- 生成任务异步化（队列）
