# AI Feed News 风格设计指南

极简科技风：冷静、专业、智能。白色画布、深灰文字、蓝色渐变主色、圆角卡片、充足留白。

## 原则

- 内容层级靠字号、字重和间距，不靠重阴影或装饰插画
- 一次只强调一个主操作（生成、保存、添加）
- 图标只用 Lucide 线性图标，不用 emoji 当结构图标
- 组件颜色走 CSS 变量，禁止在业务组件里写死品牌 hex

## 字体

- 西文：Plus Jakarta Sans（`next/font`，`font-display: swap`，关闭 size-adjusted fallback，避免 CJK 变成方框）
- 中文：Noto Sans SC + 系统黑体回退
- 等宽：Geist Mono，仅用于代码片段
- 正文不低于 14px，行高约 1.6–1.75

## 色板

### 亮色

| Token | 值 | 用途 |
| --- | --- | --- |
| `--background` | `#F8FAFC` | 页面底 |
| `--card` | `#FFFFFF` | 卡片 |
| `--foreground` | `#0F172A` | 主文字 |
| `--muted-foreground` | `#334155` | 次级文字 |
| `--primary` | `#2563EB` | 链接、强调 |
| `--brand-from` → `--brand-to` | `#2563EB` → `#38BDF8` | 主按钮渐变 |
| `--border` | `#E4E7EB` | 细边框 |
| `--destructive` | `#DC2626` | 危险操作 |

### 暗色

| Token | 值 | 用途 |
| --- | --- | --- |
| `--background` | `#0B1220` | 页面底 |
| `--card` | `#111827` | 卡片 |
| `--foreground` | `#E5E7EB` | 主文字 |
| `--muted-foreground` | `#94A3B8` | 次级文字 |
| `--primary` | `#3B82F6` | 强调 |
| 渐变 | `#3B82F6` → `#38BDF8` | 主按钮 |

正文对比度需 ≥ 4.5:1，次级文字 ≥ 3:1。暗色不要用纯 `#000000` 大底。

## 间距与圆角

- 间距节奏：8 / 16 / 24 / 32 / 48
- 控件默认高度 40px（输入框、按钮、侧栏菜单、下拉项），避免 32px 的过密密度
- 卡片圆角 12–16px（`--radius: 0.875rem`）
- 页面最大内容宽约 `72rem`，两侧保持呼吸感
- 认证页可用极淡网点 + 顶部蓝光，工作台保持干净平面

## 组件状态

- Hover / focus：150–200ms 的颜色或透明度变化
- Focus ring 必须可见（`--ring`）
- 主按钮使用 `.bg-brand-gradient`，loading 时 disabled 并改文案
- 列表等待用 Skeleton，避免整页空白转圈
- 只有首次加载（无缓存）才出 Skeleton；后台刷新一律静默，不复位已有内容
- 表单：可见 label，错误贴近字段，提交后 toast 反馈
- 可点击元素保持 `cursor-pointer`（由 Button 提供）

## 布局

- 登录后：左侧窄导航 + 顶栏（主题切换、用户菜单）
- 今日简讯：左操作、右预览；窄屏改为上下堆叠
- 个人中心用 Tabs 分隔 RSS / 大模型 / 资料

## 动效

- 默认短、弱、有意义
- 尊重 `prefers-reduced-motion`

## 反模式

- 紫色渐变套餐、Inter 默认栈、emoji 导航
- 重阴影、玻璃拟态堆叠、装饰性 3D
- 只用 placeholder 充当 label
- 生成过程中按钮仍可连点
- 亮暗模式各写一套硬编码颜色
