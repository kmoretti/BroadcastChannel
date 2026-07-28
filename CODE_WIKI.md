# BroadcastChannel / memos 项目 Code Wiki

> 项目仓库：`E:\kmoretti-github\blog_api\memos`  
> 项目名称：`broadcast-channel`（v0.3.0）  
> 定位：将 Memos 实例的公开 memo 转换为 SSR 微博客站点。

---

## 1. 项目整体架构

### 1.1 产品定位

BroadcastChannel 是一个基于 [Astro](https://astro.build/) 的**服务端渲染（SSR）微博客模板**。它不依赖传统 CMS/数据库，而是把**Memos 实例的公开 memo** 当作内容源：

- 服务端调用 Memos API (`/api/v1/memos` 等) 获取 JSON 数据；
- 解析 memo、附件、反应、标签、评论等元数据，并将 Markdown 渲染为 HTML；
- 渲染成 SEO 友好的 HTML 页面，并提供 RSS / JSON Feed / Sitemap；
- 浏览器端接近 0 JS。

### 1.2 核心设计原则

- **内容优先（content-first）**：单栏、无侧边栏、无卡片外壳；
- **服务器渲染**：所有页面在请求时构建；
- **0 浏览器 JS**：导航、搜索、分页、回到顶部均用原生 HTML/CSS 实现；
- **主题可覆盖**：提供 Base 主题 + 多个可选 CSS 覆盖主题；
- **安全边界**：Markdown 渲染后的 HTML 必须经过 `sanitizeContentHtml` 才能 `set:html`。

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
    │   getMemosInfo() / getMemoById()
    │       │
    │       ▼
    │   cache.getCachedListMemos() / cache.getCachedGetMemo() [src/lib/memos/cache.ts]
    │       │
    │       ▼
    │   $fetch Memos API (MEMOS_API_URL)
    │       │
    │       ▼
    │   parseMemo() / renderMarkdown() [src/lib/memos/parse.ts, src/lib/memos/markdown.ts]
    │       │
    │       ▼
    │   MemoEntry.astro 渲染 + sanitizeContentHtml
    │
    └── Feed / Sitemap / Manifest API 路由 → src/pages/*.ts
```

---

## 2. 目录结构

```
memos/
├── .github/workflows/        # CI：Docker 镜像构建与 fork 同步
├── public/                   # 静态资源：favicon、主题 CSS、rss.xsl、robots.txt
├── src/
│   ├── assets/               # 图标与占位图片
│   ├── components/           # Astro 组件（页面片段）
│   ├── layouts/              # 页面布局
│   ├── lib/                  # 业务逻辑与工具库
│   │   ├── memos/            # Memos API 客户端、缓存、解析、渲染
│   │   │   ├── api.ts        # Memos API 原始请求
│   │   │   ├── cache.ts      # ocache 封装
│   │   │   ├── index.ts      # 对外 API：getMemosInfo / getMemoById
│   │   │   ├── instance.ts   # 站点信息（标题/描述/头像）
│   │   │   ├── markdown.ts   # Markdown → HTML
│   │   │   ├── parse.ts      # MemoItem → Memo 领域对象
│   │   │   ├── render.ts     # 附件分组、文件大小、URL 生成
│   │   │   └── types.ts      # Memos API 原始类型
│   │   ├── env.ts            # 环境变量读取与解析
│   │   ├── feed.ts           # RSS / JSON Feed 数据组装
│   │   ├── post-ui.ts        # 时间格式化、标签链接
│   │   ├── prism.ts          # 代码高亮语言加载
│   │   ├── sanitize.ts       # HTML 消毒策略
│   │   └── seo.ts            # SEO / OpenGraph / Sitemap URL
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
├── vitest.config.ts
└── wrangler.jsonc            # Cloudflare Workers 部署配置
```

---

## 3. 技术栈

| 层级      | 技术                                                                       | 说明                                              |
| --------- | -------------------------------------------------------------------------- | ------------------------------------------------- |
| 框架      | Astro 7.x                                                                  | SSR 输出 (`output: 'server'`)                     |
| 运行时    | Node 22 LTS                                                                | 本地开发 / Docker；部署到 Workers/Edge/Serverless |
| 包管理    | pnpm 11.13.0                                                               | `packageManager` 锁定                             |
| 语言      | TypeScript 5.9                                                             | 无路径别名，使用相对路径                          |
| CSS       | Tailwind CSS v4 (`@tailwindcss/vite`)                                      | 原子工具 + 自定义 `@layer`                        |
| Markdown  | marked                                                                     | 解析 memo Markdown 内容为 HTML                    |
| HTML 消毒 | sanitize-html                                                              | 过滤渲染后的 HTML                                 |
| HTTP 请求 | ofetch                                                                     | 带超时、重试                                      |
| 缓存      | ocache                                                                     | 服务端缓存 Memos API 响应（5 分钟）               |
| 代码高亮  | prismjs + flourite                                                         | 语言检测与语法高亮                                |
| 图标      | astro-icon + `@iconify-json/ri`                                            | Remix Icon                                        |
| SEO       | astro-seo                                                                  | 元标签 / OpenGraph                                |
| 测试      | vitest                                                                     | 单元测试                                          |
| 部署      | Cloudflare Workers / Netlify / Vercel / EdgeOne / Node standalone / Docker | 多适配器                                          |

---

## 4. 主要模块职责

### 4.1 路由层：`src/pages/`

Astro 基于文件系统的路由。所有 `.astro` 文件默认服务端渲染，`.ts` 文件作为 API 路由返回 `Response`。

| 文件                      | 路由                   | 职责                                     |
| ------------------------- | ---------------------- | ---------------------------------------- |
| `index.astro`             | `/`                    | 首页，展示最新帖子列表                   |
| `before/[cursor].astro`   | `/before/:cursor`      | 游标分页：比 `:cursor` 更早的帖子        |
| `after/[cursor].astro`    | `/after/:cursor`       | 游标分页：比 `:cursor` 更新的帖子        |
| `posts/[id].astro`        | `/posts/:id`           | 单条帖子详情页，可加载 Memos 评论        |
| `search/result.astro`     | `/search/result?q=...` | 搜索结果页                               |
| `search/[q].ts`           | `/search/:q`           | 旧版搜索重定向到 `/search/result`        |
| `tags.astro`              | `/tags`                | 标签目录页（基于实际 memo 标签统计）     |
| `links.astro`             | `/links`               | 友链目录页（基于 `FRIEND_LINK_API_URL`） |
| `rss.xml.ts`              | `/rss.xml`             | RSS 2.0 Feed                             |
| `rss.json.ts`             | `/rss.json`            | JSON Feed 1.1                            |
| `sitemap.xml.ts`          | `/sitemap.xml`         | 站点地图索引                             |
| `sitemap/[cursor].xml.ts` | `/sitemap/:cursor.xml` | 分页站点地图                             |
| `rules/prefetch.json.ts`  | `/rules/prefetch.json` | Speculation Rules API 配置               |
| `site.webmanifest.ts`     | `/site.webmanifest`    | PWA Manifest                             |

### 4.2 组件层：`src/components/`

| 组件                                     | 职责                                                        |
| ---------------------------------------- | ----------------------------------------------------------- |
| `BaseLayout.astro`                       | 全局 HTML 骨架：`<head>`、SEO、主题注入、页头/页脚/主内容槽 |
| `SiteHeader.astro`                       | 站点头部：头像、标题、社交链接、站点描述                    |
| `SiteNavigation.astro`                   | 主导航 + 搜索表单                                           |
| `SearchForm.astro` / `SearchField.astro` | 桌面端/移动端搜索                                           |
| `MemosPage.astro`                        | 帖子列表页面模板：feed、分页、详情                          |
| `MemoEntry.astro`                        | 单条帖子渲染：标题、时间、内容、反应、标签、评论            |
| `CreatorAvatar.astro`                    | 创作者头像                                                  |
| `DirectorySection.astro`                 | 标签/链接目录页内容区                                       |
| `BackToTop.astro`                        | 回到顶部按钮                                                |

### 4.3 布局层：`src/layouts/`

- `BaseLayout.astro`：唯一布局。负责：
  - 引入全局 CSS `src/styles/app.css`；
  - 通过 `astro-seo` 生成 SEO/OpenGraph 元信息；
  - 注入 `HEADER_INJECT` / `FOOTER_INJECT`（管理员可控原始 HTML）；
  - 组装 `SiteHeader`、`main`、`SiteFooter`、`BackToTop`。

### 4.4 业务逻辑层：`src/lib/`

#### 4.4.1 `memos/` 子模块

| 文件          | 职责                                                                              |
| ------------- | --------------------------------------------------------------------------------- |
| `api.ts`      | Memos API 原始请求：list / get / search / comments / reactions / instance profile |
| `cache.ts`    | 使用 `ocache` 缓存 API 响应 5 分钟                                                |
| `index.ts`    | 对外暴露 `getMemosInfo(params)` 与 `getMemoById(id)`                              |
| `instance.ts` | `getSiteInfo`：从 instance profile 读取站点标题、描述、头像                       |
| `markdown.ts` | `renderMarkdown`：将 memo Markdown 渲染为 HTML，处理标签、代码块、链接            |
| `parse.ts`    | `parseMemo` / `parseComment` / `buildMemoInfo`：将 Memos API 原始项转换为领域对象 |
| `render.ts`   | 附件分组、文件大小格式化、OpenStreetMap URL、公开 memo URL                        |
| `types.ts`    | Memos API 原始响应类型                                                            |

#### 4.4.2 通用工具

| 文件          | 职责                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| `env.ts`      | 读取 `process.env` / `import.meta.env`；Memos API URL、creator 过滤、分页大小、站点信息覆盖、友链 URL |
| `feed.ts`     | 组装 RSS / JSON Feed 数据                                                                             |
| `sanitize.ts` | 对 Markdown 渲染后的 HTML 进行白名单消毒                                                              |
| `seo.ts`      | 生成 canonical、OpenGraph、分享图、favicon、manifest 链接                                             |
| `post-ui.ts`  | 相对/绝对时间格式化、标签 href、反应 aria-label                                                       |
| `prism.ts`    | 按需加载 prism 语言定义                                                                               |

### 4.5 中间件：`src/middleware.ts`

- 设置 `Astro.locals`：`SITE_URL`、`RSS_URL`、`RSS_PREFIX`；
- 处理旧版 `#tag` URL（`/search/%23xxx`）重写到 `/search/result?q=%23xxx`；
- 为 HTML 响应附加 `Speculation-Rules: /rules/prefetch.json`；
- 为 200~399 响应附加默认 `Cache-Control: public, max-age=300, s-maxage=300`。

### 4.6 样式层：`src/styles/`

| 文件                      | 职责                                                      |
| ------------------------- | --------------------------------------------------------- |
| `app.css`                 | 入口：导入 Tailwind + content + app 子模块                |
| `app/theme.css`           | CSS 变量（颜色、字体、间距、圆角）、Base 主题与 dark mode |
| `app/base.css`            | 基础元素重置与排版                                        |
| `app/shell.css`           | 站点外壳：skip-link、header、footer、导航                 |
| `app/feed.css`            | Feed 列表、帖子条目、分页、反应                           |
| `app/responsive.css`      | 移动端适配                                                |
| `app/footer.css`          | 页脚与回到顶部                                            |
| `content/typography.css`  | 内容区排版                                                |
| `content/media.css`       | 图片、视频、贴纸、链接预览                                |
| `content/syntax.css`      | 代码块与 Prism                                            |
| `content/interactive.css` | 展开块、剧透、popover、搜索                               |

---

## 5. 关键类型与数据结构

### 5.1 `src/types.ts`

```ts
export interface MemoCreator {
  name: string
  username: string
  displayName?: string
  avatarUrl?: string
}

export interface MemoAttachment {
  name: string
  filename: string
  externalLink: string
  type: string
  size: string
}

export interface MemoReaction {
  reactionType: string
  count: number
}

export interface MemoLocation {
  placeholder: string
  latitude: number
  longitude: number
}

export interface Memo {
  id: string
  shortId: string
  state: string
  creator: MemoCreator
  createTime: string
  updateTime: string
  content: string
  html: string
  visibility: string
  tags: string[]
  pinned: boolean
  attachments: MemoAttachment[]
  reactions: MemoReaction[]
  location?: MemoLocation
  property: {
    hasLink: boolean
    hasTaskList: boolean
    hasCode: boolean
    hasIncompleteTasks: boolean
    title?: string
  }
  snippet: string
}

export interface MemoComment extends Memo {
  parent: string
}

export interface MemoInfo {
  memos: Memo[]
  instanceUrl: string
  title?: string
  description?: string
  avatar?: string
  nextPageToken?: string
}

export interface SeoMeta {
  title?: string
  text?: string
  noindex?: string | boolean
  nofollow?: string | boolean
}

export interface NavItem {
  title: string
  href: string
}
```

### 5.2 核心流程说明

#### 获取首页 memo 列表

1. `index.astro` 调用 `getMemosInfo()`；
2. `getMemosInfo()` 调用 `cache.getCachedListMemos({ pageSize, pageToken })`；
3. `api.listMemos` 读取 `MEMOS_API_URL` 环境变量，请求 `GET <MEMOS_API_URL>/memos`；
4. `ofetch` 发起请求（超时 15s，重试 2 次）；
5. `ocache` 缓存结果 5 分钟；
6. `parseMemo(item)` 将每个 `MemoItem` 转换为 `Memo`，并用 `renderMarkdown` 生成 `html`；
7. `buildMemoInfo` 按 `MEMOS_CREATORS` 过滤后返回 `MemoInfo`。

#### 单帖详情

1. `posts/[id].astro` 调用 `getMemoById(id)`；
2. 分别请求 `GET /memos/:id` 与 `GET /memos/:id/comments`；
3. `parseMemo` / `parseComment` 解析为领域对象；
4. 首页列表缓存可能已包含该 memo；详情页会独立请求以确保最新数据。

#### 内容渲染

`renderMarkdown` 将 memo 的 Markdown `content` 转为 HTML：

1. 用正则把 `#tag` 转换为站内搜索链接；
2. `marked.parse` 生成原始 HTML；
3. `highlightCode` 高亮代码块；
4. 非标签链接追加 `target="_blank" rel="noopener noreferrer"`；
5. 最终通过 `sanitize-html` 白名单消毒。

`MemoEntry.astro` 再按附件类型（图片、视频、音频、其他）分组渲染。

---

## 6. 关键函数说明

### 6.1 `src/lib/memos/index.ts`

| 函数              | 签名                                                               | 说明                     |
| ----------------- | ------------------------------------------------------------------ | ------------------------ |
| `getMemosInfo`    | `(params?) => Promise<MemoInfo>`                                   | 获取 memo 列表与实例信息 |
| `getMemoById`     | `(id: string) => Promise<{ memo: Memo, comments: MemoComment[] }>` | 获取单条 memo 及其评论   |
| `getMemoComments` | `(id: string) => Promise<MemoComment[]>`                           | 获取单条 memo 的评论     |

### 6.2 `src/lib/memos/api.ts`

| 函数                       | 说明                            |
| -------------------------- | ------------------------------- |
| `listMemos(params)`        | 请求 `GET /memos`               |
| `getMemo(id)`              | 请求 `GET /memos/:id`           |
| `searchMemos(q, params)`   | 按内容/标签过滤搜索             |
| `listComments(id, params)` | 请求 `GET /memos/:id/comments`  |
| `listReactions(id)`        | 请求 `GET /memos/:id/reactions` |
| `getInstanceProfile()`     | 请求 `GET /instance/profile`    |
| `getUser(username)`        | 请求 `GET /users/:username`     |

### 6.3 `src/lib/memos/cache.ts`

| 函数                       | 说明                                |
| -------------------------- | ----------------------------------- |
| `getCachedListMemos`       | 缓存 `listMemos`（5 分钟）          |
| `getCachedGetMemo`         | 缓存 `getMemo`（5 分钟）            |
| `getCachedSearchMemos`     | 缓存 `searchMemos`（5 分钟）        |
| `getCachedListComments`    | 缓存 `listComments`（5 分钟）       |
| `getCachedInstanceProfile` | 缓存 `getInstanceProfile`（5 分钟） |

### 6.4 `src/lib/memos/parse.ts`

| 函数                                   | 说明                         |
| -------------------------------------- | ---------------------------- |
| `parseMemo(item)`                      | 将 `MemoItem` 转换为 `Memo`  |
| `parseComment(item)`                   | 将评论项转换为 `MemoComment` |
| `filterByCreators(memos)`              | 按 `MEMOS_CREATORS` 过滤     |
| `buildMemoInfo(response, instanceUrl)` | 组装 `MemoInfo`              |

### 6.5 `src/lib/memos/markdown.ts`

| 函数                      | 说明                                              |
| ------------------------- | ------------------------------------------------- |
| `renderMarkdown(content)` | Markdown → HTML，含标签、代码高亮、链接处理与消毒 |

### 6.6 `src/lib/memos/render.ts`

| 函数                                     | 说明                    |
| ---------------------------------------- | ----------------------- |
| `groupAttachments(attachments)`          | 按类型分组附件          |
| `formatFileSize(size)`                   | 格式化文件大小          |
| `getOpenStreetMapUrl(location)`          | 生成 OpenStreetMap 链接 |
| `getMemoPublicUrl(instanceUrl, shortId)` | 生成 memo 公开页链接    |

### 6.7 `src/lib/env.ts`

| 函数                                                   | 说明                                          |
| ------------------------------------------------------ | --------------------------------------------- |
| `getEnv(env, name)`                                    | 运行时 `process.env` 优先于 `import.meta.env` |
| `getMemosApiUrl(env)`                                  | Memos API 基础 URL                            |
| `getMemosCreators(env)`                                | 允许的创作者用户名列表                        |
| `getMemosPageSize(env)`                                | 每页 memo 数量                                |
| `getMemosTitle / getMemosDescription / getMemosAvatar` | 站点信息覆盖                                  |
| `getFriendLinkApiUrl / getFriendLinkApplyUrl`          | 友链 API 相关                                 |

---

## 7. 配置说明

### 7.1 环境变量

| 变量                              | 必填 | 默认值                          | 说明                                                                         |
| --------------------------------- | ---- | ------------------------------- | ---------------------------------------------------------------------------- |
| `MEMOS_API_URL`                   | 是   | `https://mm.2005815.xyz/api/v1` | Memos API 基础 URL                                                           |
| `MEMOS_CREATORS`                  | 否   | -                               | 只展示指定用户的公开 memo（半角逗号分隔）                                    |
| `MEMOS_PAGE_SIZE`                 | 否   | `20`                            | 每页 memo 数量                                                               |
| `MEMOS_TITLE`                     | 否   | -                               | 站点标题覆盖                                                                 |
| `MEMOS_DESCRIPTION`               | 否   | -                               | 站点描述覆盖                                                                 |
| `MEMOS_AVATAR`                    | 否   | -                               | 站点头像覆盖                                                                 |
| `LOCALE`                          | 否   | `en`                            | 站点语言，如 `zh-CN`                                                         |
| `SERVER_ADAPTER`                  | 否   | 自动检测                        | 部署适配器：`cloudflare_workers` / `netlify` / `vercel` / `node` / `edgeone` |
| `TWITTER`                         | 否   | -                               | X/Twitter 用户名，用于 Twitter card                                          |
| `HEADER_INJECT` / `FOOTER_INJECT` | 否   | -                               | 可信管理员原始 HTML 注入                                                     |
| `FRIEND_LINK_API_URL`             | 否   | `https://blog-api.2005815.xyz/` | 友链 API 基础 URL                                                            |
| `FRIEND_LINK_APPLY_URL`           | 否   | -                               | 友链申请页面 URL                                                             |

### 7.2 适配器选择逻辑（`astro.config.mjs`）

1. 检测 `std-env` 的 `provider`；
2. 若存在 `EDGEONE_PROJECT_ID` / `EO_MAKERS` 则视为 EdgeOne；
3. `SERVER_ADAPTER` 可覆盖自动检测；
4. 显式拒绝 `cloudflare-pages` / `cloudflare_pages`（要求使用 Workers）。

### 7.3 主题

- 基础主题 `Base` 始终加载；
- 可选主题通过 `HEADER_INJECT` 引入，如 `/themes/sepia.css`；
- 一次只能加载一个覆盖主题；
- 内置主题：Sepia、Aria、Terminal（Amber/Green/Cyan/Magenta）、HN News、ZAE。

---

## 8. 依赖关系

### 8.1 运行时/构建依赖

- `astro`：框架核心；
- `@astrojs/cloudflare` / `@astrojs/netlify` / `@astrojs/node` / `@astrojs/vercel` / `@edgeone/astro`：部署适配器；
- `@astrojs/rss`：RSS 生成；
- `astro-icon` + `@iconify-json/ri`：图标；
- `astro-seo`：SEO 元信息；
- `@tailwindcss/vite` + `tailwindcss`：CSS 工具；
- `marked`：Markdown 渲染；
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
lib/memos/index.ts
    │
    ├── lib/memos/cache.ts  ──► lib/memos/api.ts, ocache
    │
    ├── lib/memos/api.ts    ──► ofetch, lib/env.ts
    │
    ▼
lib/memos/parse.ts
    │
    ├── lib/memos/markdown.ts  ──► lib/prism.ts, sanitize-html
    ├── lib/memos/render.ts
    └── lib/env.ts
    │
    ▼
components/MemoEntry.astro
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
# 必须设置 MEMOS_API_URL
MEMOS_API_URL=https://mm.2005815.xyz/api/v1 pnpm dev
# 或
pnpm start
```

### 9.3 构建

```bash
MEMOS_API_URL=https://mm.2005815.xyz/api/v1 pnpm build
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
docker run -d --name broadcastchannel -p 4321:4321 -e MEMOS_API_URL=https://mm.2005815.xyz/api/v1 ghcr.io/miantiao-me/broadcastchannel:main
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
- 设置环境变量 `MEMOS_API_URL`；
- 自动识别适配器（EdgeOne 通过 `EDGEONE_PROJECT_ID` / `EO_MAKERS` 检测）。

---

## 10. 测试

测试使用 **Vitest**，覆盖关键工具函数：

- `src/middleware.test.ts`：中间件响应头与缓存判断；
- `src/lib/*.test.ts`：env、feed、post-ui、prism、sanitize、seo 等。

新增功能建议补充对应测试，运行：

```bash
pnpm test
```

---

## 11. 安全与注意事项

1. **外部 HTML 消毒**：Markdown 渲染后的 `html` 以及站点描述等都必须经过 `sanitizeContentHtml` 才能 `set:html`；
2. **原始 HTML 注入**：`HEADER_INJECT` / `FOOTER_INJECT` 是**可信管理员**边界，不应注入用户输入；
3. **运行时环境变量优先**：`process.env` 覆盖 `import.meta.env`，确保部署平台变量生效；
4. **缓存策略**：HTML 默认 5 分钟；RSS / Sitemap 默认 1 小时；Memos API 响应 5 分钟；
5. **CORS / 访问**：Memos 实例必须允许公开读取对应 memo。

---

## 12. 扩展与定制建议

- **新增主题**：在 `public/themes/` 添加 CSS，并在 `DESIGN.md` / `THEMES.md` / `NOTICE.md` 登记来源；
- **新增页面**：在 `src/pages/` 添加 `.astro` 或 `.ts` 文件；
- **修改内容解析**：优先在 `src/lib/memos/parse.ts` 与 `src/lib/memos/markdown.ts` 中调整；
- **调整缓存**：修改 `src/lib/memos/cache.ts` 中 `defineCachedFunction` 的参数。

---

## 13. 常见问题速查

| 现象                  | 排查方向                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------- |
| 部署后内容为空        | `MEMOS_API_URL` 是否可访问；实例是否公开；`MEMOS_CREATORS` 是否过滤掉了目标用户；是否重新部署 |
| 图片/视频不显示       | 附件 `externalLink` 是否可访问；Memos 实例是否允许外部读取资源                                |
| 评论不显示            | 对应 memo 是否已开启评论；Memos API 是否返回评论数据                                          |
| 反应不显示            | 对应 memo 是否有反应；Memos API 是否返回反应数据                                              |
| 主题未生效            | 是否通过 `HEADER_INJECT` 引入；是否同时引入多个主题                                           |
| Cloudflare Pages 报错 | 必须使用 Workers（`SERVER_ADAPTER=cloudflare_workers`），Pages SSR 不受支持                   |

---

_本 Wiki 基于仓库当前代码状态整理，后续若业务源或框架版本发生重大变更，应同步更新。_
