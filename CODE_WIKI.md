# BroadcastChannel / memos 项目 Code Wiki

> 项目仓库：`E:\kmoretti-github\blog_api\memos`  
> 项目名称：`broadcast-channel`（v0.3.0）  
> 定位：将公开 Telegram Channel 转换为 SSR 微博客站点。

---

## 1. 项目整体架构

### 1.1 产品定位

BroadcastChannel 是一个基于 [Astro](https://astro.build/) 的**服务端渲染（SSR）微博客模板**。它不依赖传统 CMS/数据库，而是把**公开 Telegram 频道**当作内容源：

- 服务端抓取 `https://t.me/s/<CHANNEL>`（或 `telegram.dog` / `telegram.me`）的公开 HTML 预览；
- 解析消息、媒体、表情、反应、标签等元数据；
- 渲染成 SEO 友好的 HTML 页面，并提供 RSS / JSON Feed / Sitemap；
- 浏览器端接近 0 JS（除 Telegram 评论 Widget 外）。

### 1.2 核心设计原则

- **内容优先（content-first）**：单栏、无侧边栏、无卡片外壳；
- **服务器渲染**：所有页面在请求时构建；
- **0 浏览器 JS**：导航、搜索、分页、回到顶部均用原生 HTML/CSS 实现；
- **主题可覆盖**：提供 Base 主题 + 多个可选 CSS 覆盖主题；
- **安全边界**：外部 Telegram HTML 必须经过 `sanitizeContentHtml` 才能 `set:html`。

### 1.3 请求数据流

```
浏览器请求
    │
    ▼
Astro SSR (output: 'server')
    │
    ├── HTML 页面路由 → src/pages/*.astro
    │       │
    │       ▼
    │   getChannelInfo() / getChannelPost()
    │       │
    │       ▼
    │   loadChannelDocument() [src/lib/telegram/request.ts]
    │       │
    │       ▼
    │   $fetch Telegram 公开页面 (t.me/s/CHANNEL)
    │       │
    │       ▼
    │   cheerio 解析 + extractPost() [src/lib/telegram/parse.ts]
    │       │
    │       ▼
    │   PostEntry.astro 渲染 + sanitizeContentHtml
    │
    └── 静态资源 /static/* → src/pages/static/[...url].ts
            │
            ▼
        createStaticProxyResponse() 代理到 Telegram CDN
```

---

## 2. 目录结构

```
memos/
├── .github/workflows/        # CI：Docker 镜像构建与 fork 同步
├── api/static/               # Vercel Edge Function 静态代理入口
├── public/                   # 静态资源：favicon、主题 CSS、rss.xsl、robots.txt
├── src/
│   ├── assets/               # 图标与占位图片
│   ├── components/           # Astro 组件（页面片段）
│   ├── layouts/              # 页面布局
│   ├── lib/                  # 业务逻辑与工具库
│   │   ├── telegram/         # Telegram 抓取、解析、渲染
│   │   │   ├── media/        # 图片/视频/音频/贴纸/链接预览/引用
│   │   │   ├── renderers/    # 特殊内容渲染器
│   │   │   ├── content.ts    # HTML 内容后处理
│   │   │   ├── emoji.ts      # 表情与自定义表情
│   │   │   ├── index.ts      # 对外 API：getChannelInfo / getChannelPost
│   │   │   ├── parse.ts      # 从 cheerio 提取 Post 对象
│   │   │   ├── request.ts    # 请求 Telegram 并缓存
│   │   │   ├── types.ts      # Telegram 模块类型
│   │   │   └── url.ts        # URL 归一化与代理
│   │   ├── env.ts            # 环境变量读取与解析
│   │   ├── feed.ts           # RSS / JSON Feed 数据组装
│   │   ├── post-ui.ts        # 时间格式化、标签链接、反应标签
│   │   ├── prism.ts          # 代码高亮语言加载
│   │   ├── sanitize.ts       # HTML 消毒策略
│   │   ├── seo.ts            # SEO / OpenGraph / Sitemap URL
│   │   ├── social.ts         # 社交媒体链接生成
│   │   └── static-proxy.ts   # 静态资源代理（带白名单）
│   ├── pages/                # Astro 路由（页面 + API 路由）
│   ├── styles/               # CSS（Tailwind v4 + 自定义层）
│   │   ├── app/              # 布局、主题变量、Feed、响应式
│   │   └── content/          # 内容排版、媒体、代码高亮、交互
│   ├── env.d.ts
│   ├── middleware.ts         # Astro 中间件：URL、缓存头、Speculation Rules
│   └── types.ts              # 全局 TypeScript 类型
├── .env.example              # 环境变量示例
├── AGENTS.md / CLAUDE.md     # 编码代理仓库指南（CLAUDE.md 是 AGENTS.md 的软链接）
├── DESIGN.md                 # 设计系统文档
├── README.md / README.zh-cn.md
├── THEMES.md                 # 主题使用说明
├── astro.config.mjs          # Astro 配置与多平台适配器选择
├── eslint.config.mjs         # ESLint（Antfu + Astro）
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── vercel.json               # Vercel 重写规则（/static/* → /api/static）
├── vitest.config.ts
└── wrangler.jsonc            # Cloudflare Workers 部署配置
```

---

## 3. 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | Astro 7.x | SSR 输出 (`output: 'server'`) |
| 运行时 | Node 22 LTS | 本地开发 / Docker；部署到 Workers/Edge/Serverless |
| 包管理 | pnpm 11.13.0 | `packageManager` 锁定 |
| 语言 | TypeScript 5.9 | 无路径别名，使用相对路径 |
| CSS | Tailwind CSS v4 (`@tailwindcss/vite`) | 原子工具 + 自定义 `@layer` |
| HTML 解析 | cheerio | 解析 Telegram 公开页面 |
| HTTP 请求 | ofetch | 带超时、重试 |
| 缓存 | ocache | 服务端缓存 Telegram HTML（5 分钟） |
| HTML 消毒 | sanitize-html | 过滤 Telegram 外部 HTML |
| 代码高亮 | prismjs + flourite | 语言检测与语法高亮 |
| 图标 | astro-icon + `@iconify-json/ri` | Remix Icon |
| SEO | astro-seo | 元标签 / OpenGraph |
| 测试 | vitest | 单元测试 |
| 部署 | Cloudflare Workers / Netlify / Vercel / EdgeOne / Node standalone / Docker | 多适配器 |

---

## 4. 主要模块职责

### 4.1 路由层：`src/pages/`

Astro 基于文件系统的路由。所有 `.astro` 文件默认服务端渲染，`.ts` 文件作为 API 路由返回 `Response`。

| 文件 | 路由 | 职责 |
|------|------|------|
| `index.astro` | `/` | 首页，展示最新帖子列表 |
| `before/[cursor].astro` | `/before/:cursor` | 游标分页：比 `:cursor` 更早的帖子 |
| `after/[cursor].astro` | `/after/:cursor` | 游标分页：比 `:cursor` 更新的帖子 |
| `posts/[id].astro` | `/posts/:id` | 单条帖子详情页，可加载 Telegram 评论 |
| `search/result.astro` | `/search/result?q=...` | 搜索结果页 |
| `search/[q].ts` | `/search/:q` | 旧版搜索重定向到 `/search/result` |
| `tags.astro` | `/tags` | 标签目录页（基于 `TAGS` 环境变量） |
| `links.astro` | `/links` | 外链目录页（基于 `LINKS` 环境变量） |
| `rss.xml.ts` | `/rss.xml` | RSS 2.0 Feed |
| `rss.json.ts` | `/rss.json` | JSON Feed 1.1 |
| `sitemap.xml.ts` | `/sitemap.xml` | 站点地图索引 |
| `sitemap/[cursor].xml.ts` | `/sitemap/:cursor.xml` | 分页站点地图 |
| `static/[...url].ts` | `/static/*` | 静态资源代理（Telegram CDN） |
| `rules/prefetch.json.ts` | `/rules/prefetch.json` | Speculation Rules API 配置 |
| `site.webmanifest.ts` | `/site.webmanifest` | PWA Manifest |

### 4.2 组件层：`src/components/`

| 组件 | 职责 |
|------|------|
| `BaseLayout.astro` | 全局 HTML 骨架：`<head>`、SEO、主题注入、页头/页脚/主内容槽 |
| `SiteHeader.astro` | 站点头部：头像、标题、社交链接、频道描述 |
| `SiteNavigation.astro` | 主导航 + 搜索表单 |
| `SearchForm.astro` / `SearchField.astro` | 桌面端/移动端搜索 |
| `PostsPage.astro` | 帖子列表页面模板：feed、分页、详情 |
| `PostEntry.astro` | 单条帖子渲染：标题、时间、内容、反应、标签、评论 |
| `ChannelAvatar.astro` | 频道头像（带静态代理） |
| `DirectorySection.astro` | 标签/链接目录页内容区 |
| `BackToTop.astro` | 回到顶部按钮 |

### 4.3 布局层：`src/layouts/`

- `BaseLayout.astro`：唯一布局。负责：
  - 引入全局 CSS `src/styles/app.css`；
  - 通过 `astro-seo` 生成 SEO/OpenGraph 元信息；
  - 注入 `HEADER_INJECT` / `FOOTER_INJECT`（管理员可控原始 HTML）；
  - 组装 `SiteHeader`、`main`、`SiteFooter`、`BackToTop`。

### 4.4 业务逻辑层：`src/lib/`

#### 4.4.1 `telegram/` 子模块

| 文件 | 职责 |
|------|------|
| `index.ts` | 对外暴露 `getChannelInfo(params)` 与 `getChannelPost(id)` |
| `request.ts` | `loadChannelDocument`：构造 Telegram URL、使用 `ofetch` 抓取、用 `ocache` 缓存 5 分钟 |
| `parse.ts` | `extractPost`：从 cheerio 节点提取 `Post` 对象，包括内容、媒体、反应、标签 |
| `content.ts` | `modifyHTMLContent`：处理表情、URL、展开块、剧透、代码高亮 |
| `url.ts` | URL 实体解码、代理 URL 生成、srcset/style 中的 URL 重写 |
| `emoji.ts` | 标准表情归一化、自定义表情图片 URL |
| `media/images.ts` | 图片消息：生成预览按钮 + popover 大图 |
| `media/playback.ts` | 视频/语音消息：重写 src、添加 controls |
| `media/link-preview.ts` | 链接预览卡片 |
| `media/references.ts` | 回复/转发来源 |
| `media/stickers.ts` | 静态/TGS/视频贴纸 |
| `renderers/raw.ts` | 原始内容兜底渲染 |

#### 4.4.2 通用工具

| 文件 | 职责 |
|------|------|
| `env.ts` | 读取 `process.env` / `import.meta.env`；解析 CSV、分号分隔导航项；静态代理/主机名默认值 |
| `feed.ts` | 组装 RSS / JSON Feed 数据 |
| `sanitize.ts` | 对 Telegram HTML 进行白名单消毒；`sanitizeFeedHtml` 会过滤掉弹窗大图 |
| `seo.ts` | 生成 canonical、OpenGraph、分享图、favicon、manifest 链接 |
| `social.ts` | 根据环境变量生成 RSS/Podcast/X/GitHub/Telegram/Discord/Mastodon/Bluesky 社交链接 |
| `post-ui.ts` | 相对/绝对时间格式化、标签 href、反应 aria-label |
| `prism.ts` | 按需加载 prism 语言定义 |
| `static-proxy.ts` | 代理静态资源到 Telegram CDN，带域名白名单与请求头转发 |

### 4.5 中间件：`src/middleware.ts`

- 设置 `Astro.locals`：`SITE_URL`、`RSS_URL`、`RSS_PREFIX`；
- 处理旧版 `#tag` URL（`/search/%23xxx`）重写到 `/search/result?q=%23xxx`；
- 为 HTML 响应附加 `Speculation-Rules: /rules/prefetch.json`；
- 为 200~399 响应附加默认 `Cache-Control: public, max-age=300, s-maxage=300`。

### 4.6 样式层：`src/styles/`

| 文件 | 职责 |
|------|------|
| `app.css` | 入口：导入 Tailwind + content + app 子模块 |
| `app/theme.css` | CSS 变量（颜色、字体、间距、圆角）、Base 主题与 dark mode |
| `app/base.css` | 基础元素重置与排版 |
| `app/shell.css` | 站点外壳：skip-link、header、footer、导航 |
| `app/feed.css` | Feed 列表、帖子条目、分页、反应 |
| `app/responsive.css` | 移动端适配 |
| `app/footer.css` | 页脚与回到顶部 |
| `content/typography.css` | 内容区排版 |
| `content/media.css` | 图片、视频、贴纸、链接预览 |
| `content/syntax.css` | 代码块与 Prism |
| `content/interactive.css` | 展开块、剧透、popover、搜索 |
| `content/telegram-widgets.css` | Telegram 评论与内嵌控件 |
| `content/link-preview.css` | 链接预览卡片样式 |

---

## 5. 关键类型与数据结构

### 5.1 `src/types.ts`

```ts
export interface Reaction {
  emoji: string
  emojiId?: string
  emojiImage?: string
  count: string
  isPaid: boolean
}

export interface Post {
  id: string
  title: string
  type: 'text' | 'service'
  datetime: string
  tags: string[]
  text: string
  description?: string
  content: string
  reactions: Reaction[]
}

export interface ChannelInfo {
  posts: Post[]
  title: string
  description: string
  descriptionHTML: string | null
  avatar: string | undefined
}

export interface SeoMeta {
  title?: string
  text?: string
  noindex?: string | boolean
  nofollow?: string | boolean
}

export interface GetChannelInfoParams {
  before?: string
  after?: string
  q?: string
}

export interface NavItem {
  title: string
  href: string
}
```

### 5.2 核心流程说明

#### 获取频道首页

1. `index.astro` 调用 `getChannelInfo()`；
2. `getChannelInfo()` 调用 `loadChannelDocument({})`；
3. `loadChannelDocument` 读取 `CHANNEL` 环境变量，构造 `https://<TELEGRAM_HOST>/s/<CHANNEL>`；
4. `fetchTelegramHtml` 通过 `ofetch` 抓取 HTML（超时 15s，重试 3 次）；
5. `ocache` 缓存结果 5 分钟；
6. 用 `cheerio.load` 解析；
7. `extractPost($, node, options)` 遍历 `.tgme_widget_message_wrap`，逐个生成 `Post`；
8. 结果 `reverse()` 后按时间从新到旧排列。

#### 单帖详情

1. `posts/[id].astro` 调用 `getChannelPost(id)`；
2. 构造 `https://<TELEGRAM_HOST>/<CHANNEL>/<id>?embed=1&mode=tme`；
3. 解析单条消息；
4. 同时首页 channel 数据可能已包含该帖，优先从缓存中命中，否则再请求一次单帖。

#### 内容渲染顺序

`renderPostContent` 按固定顺序拼接 HTML 片段：

1. 转发来源 (`getForwardedFrom`)
2. 回复引用 (`getReply`)
3. 图片 (`getImages`)
4. 视频 (`getVideo`)
5. 音频 (`getAudio`)
6. 正文文本 (`content.html()`)
7. 图片贴纸 / TGS 贴纸 / 视频贴纸
8. 原始内容兜底 (`renderRawContent`)
9. 链接预览 (`getLinkPreview`)

---

## 6. 关键函数说明

### 6.1 `src/lib/telegram/index.ts`

| 函数 | 签名 | 说明 |
|------|------|------|
| `isRenderablePost` | `(post) => boolean` | 判断 Post 是否可渲染（有 id、type 为 text、有 content） |
| `getChannelPost` | `(id: string) => Promise<Post \| null>` | 获取单条帖子 |
| `getChannelInfo` | `(params?) => Promise<ChannelInfo>` | 获取频道信息与帖子列表 |

### 6.2 `src/lib/telegram/request.ts`

| 函数 | 说明 |
|------|------|
| `getTelegramRequestHeaders()` | 返回统一的 `accept` 与 `user-agent` |
| `fetchTelegramHtml(params)` | 原始抓取函数 |
| `loadChannelDocument(params)` | 带缓存的封装，返回 cheerio 实例与配置 |

### 6.3 `src/lib/telegram/parse.ts`

| 函数 | 说明 |
|------|------|
| `rewriteTagLinksAndCollectTags` | 将 Telegram 标签链接 `?q=#xxx` 改写为站内搜索链接，并收集标签 |
| `renderPostContent` | 按固定顺序组合帖子各媒体/内容片段 |
| `getReactions` | 解析消息反应（含付费反应） |
| `extractPost` | 主解析函数，输出完整 `Post` 对象 |

### 6.4 `src/lib/telegram/content.ts`

| 函数 | 说明 |
|------|------|
| `hydrateTgEmoji` | 将 `<tg-emoji>` 替换为 `<img>` |
| `modifyHTMLContent` | 内容后处理：URL 归一化、展开块、剧透、代码高亮 |

### 6.5 `src/lib/env.ts`

| 函数 | 说明 |
|------|------|
| `getEnv(env, name)` | 运行时 `process.env` 优先于 `import.meta.env` |
| `getStaticProxy(env)` | 静态代理前缀，默认 `/static/` |
| `getTelegramHost(env)` | Telegram 域名，默认 `telegram.me` |
| `getBooleanEnv(env, name)` | 解析 `true`/`1` 为 true |
| `parseDelimitedItems(value)` | 解析 `Title,URL;...` 为 `NavItem[]` |
| `parseCsvList(value)` | 解析逗号分隔列表 |
| `getTargetWhitelist(env)` | 追加静态代理白名单域名 |

### 6.6 `src/lib/static-proxy.ts`

| 函数 | 说明 |
|------|------|
| `resolveStaticProxyTarget(rawTarget)` | 解析原始目标 URL |
| `isStaticProxyWhitelisted(target)` | 检查域名是否在白名单（默认 Telegram 相关域名 + `TARGET_WHITELIST`） |
| `createStaticProxyResponse(request, rawTarget)` | 转发请求并返回上游响应 |

---

## 7. 配置说明

### 7.1 环境变量（`CHANNEL` 必填）

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `CHANNEL` | 是 | - | Telegram 公开频道用户名（`t.me/` 后的字符串） |
| `LOCALE` | 否 | `en` | 站点语言，如 `zh-CN` |
| `TIMEZONE` | 否 | - | 时区，如 `Asia/Shanghai` |
| `TELEGRAM_HOST` | 否 | `telegram.me` | Telegram 主机名，可设为 `telegram.dog` |
| `STATIC_PROXY` | 否 | `/static/` | 静态资源代理前缀；设为空字符串则直接引用 Telegram URL |
| `TARGET_WHITELIST` | 否 | - | 追加静态代理白名单域名（逗号分隔，仅域名） |
| `SERVER_ADAPTER` | 否 | 自动检测 | 部署适配器：`cloudflare_workers` / `netlify` / `vercel` / `node` / `edgeone` |
| `TELEGRAM` / `TWITTER` / `GITHUB` / `MASTODON` / `BLUESKY` | 否 | - | 社交媒体用户名 |
| `DISCORD` / `PODCAST` | 否 | - | 完整 URL |
| `HEADER_INJECT` / `FOOTER_INJECT` | 否 | - | 可信管理员原始 HTML 注入 |
| `NOFOLLOW` / `NOINDEX` | 否 | `false` | SEO 控制 |
| `HIDE_DESCRIPTION` | 否 | `false` | 隐藏频道描述 |
| `COMMENTS` | 否 | `false` | 帖子详情页启用 Telegram 评论 Widget |
| `REACTIONS` | 否 | `false` | 显示消息反应 |
| `RSS_BEAUTIFY` | 否 | `false` | RSS 使用 `rss.xsl` 美化 |
| `TAGS` | 否 | - | 标签目录，逗号分隔 |
| `LINKS` / `NAVS` | 否 | - | 外链/导航，格式 `Title,URL;...` |
| `GOOGLE_SEARCH_SITE` | 否 | - | 使用 Google 站内搜索 |

### 7.2 适配器选择逻辑（`astro.config.mjs`）

1. 检测 `std-env` 的 `provider`；
2. 若存在 `EDGEONE_PROJECT_ID` / `EO_MAKERS` 则视为 EdgeOne；
3. `SERVER_ADAPTER` 可覆盖自动检测；
4. 显式拒绝 `cloudflare-pages` / `cloudflare_pages`（要求使用 Workers）。

### 7.3 主题

- 基础主题 `Base` 始终加载；
- 可选主题通过 `HEADER_INJECT` 引入，如 `/themes/sepia.css`；
- 一次只能加载一个覆盖主题；
- 内置主题：Sepia、Aria、Terminal（Amber/Green/Cyan/Magenta）、HN News、TG Channel、ZAE。

---

## 8. 依赖关系

### 8.1 运行时/构建依赖

- `astro`：框架核心；
- `@astrojs/cloudflare` / `@astrojs/netlify` / `@astrojs/node` / `@astrojs/vercel` / `@edgeone/astro`：部署适配器；
- `@astrojs/rss`：RSS 生成；
- `astro-icon` + `@iconify-json/ri`：图标；
- `astro-seo`：SEO 元信息；
- `@tailwindcss/vite` + `tailwindcss`：CSS 工具；
- `cheerio`：HTML 解析；
- `ofetch`：HTTP 请求；
- `ocache`：服务端缓存；
- `sanitize-html`：HTML 消毒；
- `prismjs` + `prismjs-components-importer`：代码高亮；
- `flourite`：代码语言检测；
- `std-env`：运行环境检测。

### 8.2 开发依赖

- `typescript`、`vitest`、`eslint`、`@antfu/eslint-config`；
- `simple-git-hooks` + `lint-staged`：提交前自动格式化。

### 8.3 内部模块依赖图（核心链路）

```
Pages (index.astro / posts/[id].astro / ...)
    │
    ▼
lib/telegram/index.ts
    │
    ├── lib/telegram/request.ts  ──► ofetch, ocache, lib/env.ts
    │
    ▼
lib/telegram/parse.ts
    │
    ├── lib/telegram/content.ts  ──► lib/prism.ts, lib/telegram/emoji.ts, lib/telegram/url.ts
    ├── lib/telegram/media/*     ──► lib/telegram/url.ts
    ├── lib/telegram/emoji.ts    ──► lib/telegram/url.ts
    └── lib/telegram/url.ts
    │
    ▼
components/PostEntry.astro
    │
    ├── lib/sanitize.ts
    ├── lib/post-ui.ts
    └── lib/env.ts
```

---

## 9. 项目运行方式

### 9.1 安装依赖

```bash
pnpm install
```

### 9.2 本地开发

```bash
# 必须设置 CHANNEL
CHANNEL=miantiao_me pnpm dev
# 或
pnpm start
```

### 9.3 构建

```bash
CHANNEL=miantiao_me pnpm build
```

### 9.4 预览生产构建

```bash
pnpm preview
```

### 9.5 代码检查与测试

```bash
pnpm lint           # ESLint 全量检查
pnpm lint:fix       # 自动修复
pnpm typecheck      # TypeScript 类型检查（tsc --noEmit）
pnpm test           # 运行 Vitest
pnpm vitest run <test-file>   # 单个测试文件
```

### 9.6 Docker 运行

```bash
docker pull ghcr.io/miantiao-me/broadcastchannel:main
docker run -d --name broadcastchannel -p 4321:4321 -e CHANNEL=miantiao_me ghcr.io/miantiao-me/broadcastchannel:main
```

### 9.7 Cloudflare Workers 部署

```bash
pnpm exec wrangler login
SERVER_ADAPTER=cloudflare_workers pnpm build
pnpm exec wrangler deploy
```

> 注意：Cloudflare Pages SSR 不受支持，必须使用 Workers。

### 9.8 Vercel / Netlify / EdgeOne

- 连接 Git 仓库；
- 框架选择 Astro；
- 设置环境变量 `CHANNEL`；
- 自动识别适配器（EdgeOne 通过 `EDGEONE_PROJECT_ID` / `EO_MAKERS` 检测）。

---

## 10. 测试

测试使用 **Vitest**，覆盖关键工具函数：

- `src/middleware.test.ts`：中间件响应头与缓存判断；
- `src/lib/telegram/*.test.ts`：URL 解析、内容处理、表情、请求等；
- `src/lib/*.test.ts`：env、feed、post-ui、prism、sanitize、seo、static-proxy 等。

新增功能建议补充对应测试，运行：

```bash
pnpm test
```

---

## 11. 安全与注意事项

1. **外部 HTML 消毒**：所有来自 Telegram 的 `content` / `descriptionHTML` 都必须经过 `sanitizeContentHtml` 才能 `set:html`；
2. **静态代理白名单**：`/static/*` 只能代理到 Telegram 相关域名及 `TARGET_WHITELIST` 中的域名；
3. **原始 HTML 注入**：`HEADER_INJECT` / `FOOTER_INJECT` 是**可信管理员**边界，不应注入用户输入；
4. **运行时环境变量优先**：`process.env` 覆盖 `import.meta.env`，确保部署平台变量生效；
5. **缓存策略**：HTML 默认 5 分钟；RSS / Sitemap 默认 1 小时；Telegram 抓取 5 分钟；
6. **CORS / 访问**：频道必须是公开的，且未开启 "Restrict Saving Content"。

---

## 12. 扩展与定制建议

- **新增主题**：在 `public/themes/` 添加 CSS，并在 `DESIGN.md` / `THEMES.md` / `NOTICE.md` 登记来源；
- **新增社交媒体**：在 `src/lib/social.ts` 添加链接生成逻辑；
- **新增页面**：在 `src/pages/` 添加 `.astro` 或 `.ts` 文件；
- **修改内容解析**：优先在 `src/lib/telegram/parse.ts` 与 `src/lib/telegram/content.ts` 中调整；
- **调整缓存**：修改 `src/lib/telegram/request.ts` 中 `defineCachedFunction` 的参数。

---

## 13. 常见问题速查

| 现象 | 排查方向 |
|------|----------|
| 部署后内容为空 | 频道是否公开；`CHANNEL` 是否为字符串用户名；是否开启 Restrict Saving Content；是否重新部署 |
| 图片/视频不显示 | `STATIC_PROXY` 是否配置正确；Telegram CDN 是否被墙；`TARGET_WHITELIST` 是否正确 |
| 评论不显示 | `COMMENTS` 是否设为 `true`；频道是否已关联 Telegram Discussion Group |
| 反应不显示 | `REACTIONS` 是否设为 `true` |
| 主题未生效 | 是否通过 `HEADER_INJECT` 引入；是否同时引入多个主题 |
| Cloudflare Pages 报错 | 必须使用 Workers（`SERVER_ADAPTER=cloudflare_workers`），Pages SSR 不受支持 |

---

*本 Wiki 基于仓库当前代码状态整理，后续若业务源或框架版本发生重大变更，应同步更新。*
