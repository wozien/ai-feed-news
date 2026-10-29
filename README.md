# AI Feed News

从多个网站的 RSS / Atom 源拉取当日资讯，交给你配置的大模型，生成并保存每日 AI 简讯（Markdown）。

## 技术栈

- Next.js 16 App Router + Tailwind CSS v4 + shadcn/ui + lucide
- REST Route Handlers（不使用 Server Actions）
- Better Auth：邮箱密码，可选 GitHub / Google
- Drizzle ORM + Neon PostgreSQL

## 环境要求

- Node.js 22 LTS
- pnpm 10+
- Neon 项目（池化连接 + 直连）

## 快速开始

```bash
pnpm install
cp .env.example .env.local
```

编辑 `.env.local`：

```bash
# 池化连接，给应用运行时
DATABASE_URL=postgresql://...-pooler.../neondb?sslmode=require
# 直连，给 drizzle-kit migrate
DATABASE_URL_UNPOOLED=postgresql://.../neondb?sslmode=require

BETTER_AUTH_SECRET=$(openssl rand -base64 32)
BETTER_AUTH_URL=http://localhost:3000
ENCRYPTION_KEY=$(openssl rand -hex 32)
```

GitHub / Google 变量留空也可以，登录页会隐藏对应按钮。

```bash
pnpm db:migrate
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 最小使用路径

1. 注册或登录
2. 个人中心添加 RSS 源，并配置至少一个大模型档案（设为默认）
3. 今日简讯页点击「生成今日简讯」，预览 Markdown
4. 保存后可在历史简讯按日期筛选

## OAuth 回调

在对应控制台配置：

- GitHub：`{BETTER_AUTH_URL}/api/auth/callback/github`
- Google：`{BETTER_AUTH_URL}/api/auth/callback/google`

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 本地开发 |
| `pnpm build` / `pnpm start` | 生产构建与启动 |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | 根据 schema 生成 SQL |
| `pnpm db:migrate` | 执行迁移（直连） |
| `pnpm db:studio` | Drizzle Studio |

## 文档

- [功能设计](docs/feature-design.md)
- [网站风格设计指南](docs/design-guidelines.md)
- [Agent 约定](AGENTS.md)
