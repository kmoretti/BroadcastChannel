# BroadcastChannel

**将 Memos 实例转换为轻量、可订阅、适合公开访问的微博客站点。**

BroadcastChannel 是一个基于 Astro 的 SSR 微博客前端：它从 Memos API 读取公开动态，提供时间线、详情页、搜索、标签、友链、RSS、JSON Feed 和 Sitemap 等能力。项目不负责写入或管理 Memos 数据，内容编辑仍在 Memos 中完成。

- 数据源：[Memos](https://usememos.com)
- 前端框架：[Astro](https://astro.build/)
- 包管理器：pnpm
- 支持运行方式：Node.js、Docker、Vercel、Netlify、Cloudflare Workers、EdgeOne
- 默认开发地址：`http://localhost:4321`

## 功能概览

- 从 Memos API 获取公开 memo 并渲染为微博客时间线
- 支持 memo 详情、评论、标签、全文搜索、分页和附件预览
- 支持自定义站点标题、描述、Logo、站点头像和作者信息
- 支持 RSS 2.0、JSON Feed 1.1、Sitemap 和 Web App Manifest
- 支持 RSS、X、GitHub、Telegram、QQ、邮箱、哔哩哔哩等页头链接
- 支持明暗模式、响应式布局、主题覆盖和自定义 HTML 注入
- 浏览器端默认不依赖业务 JavaScript，主要内容由服务端渲染
- 支持按 Memos 用户名过滤公开 memo

## 工作流程

```text
Memos API
   │
   ├─ 公开 memo、用户、附件、评论
   │
   ▼
BroadcastChannel 服务端渲染
   │
   ├─ 页面路由
   ├─ RSS / JSON Feed
   ├─ Sitemap / Manifest
   └─ 搜索重定向
   │
   ▼
浏览器、RSS 阅读器、搜索引擎
```

项目会通过服务端请求 Memos API，解析 memo 内容并进行 Markdown 渲染和 HTML 清理，然后生成页面或订阅输出。请确保 Memos 实例允许匿名访问目标内容，并将需要展示的 memo 设置为公开状态。

## 页面路由

| 路径                      | 说明                                          |
| ------------------------- | --------------------------------------------- |
| `/`                       | 首页时间线，展示公开 memo                     |
| `/before/:cursor`         | 按分页 token 查看更早的 memo                  |
| `/posts/:id`              | memo 详情页及评论                             |
| `/tags`                   | 标签列表                                      |
| `/links`                  | 友链页面                                      |
| `/search/result?q=关键词` | 搜索结果页                                    |
| `/search/:q`              | 搜索路径，永久重定向到 `/search/result?q=...` |
| `/site.webmanifest`       | Web App Manifest                              |
| `/rules/prefetch.json`    | 浏览器 Speculation Rules 配置                 |

## 公开接口

这些接口由 BroadcastChannel 提供，适合浏览器、RSS 阅读器和搜索引擎访问。它们不是 Memos 的管理 API，也不支持创建、修改或删除 memo。

### RSS Feed

```http
GET /rss.xml
```

返回 RSS XML，默认读取最多 50 条 memo。

响应头包含：

```http
Content-Type: application/xml; charset=utf-8
Cache-Control: public, max-age=3600
```

示例：

```bash
curl https://example.com/rss.xml
```

### JSON Feed

```http
GET /rss.json
```

返回 [JSON Feed 1.1](https://www.jsonfeed.org/version/1.1/) 格式数据，默认读取最多 50 条 memo。

响应头：

```http
Content-Type: application/feed+json; charset=utf-8
Cache-Control: public, max-age=3600
```

主要字段包括：

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "站点标题",
  "description": "站点描述",
  "home_page_url": "https://example.com",
  "feed_url": "https://example.com/rss.json",
  "items": []
}
```

### Sitemap

```http
GET /sitemap.xml
```

返回公开 memo 详情页的 XML Sitemap，默认读取最多 1000 条 memo。

```bash
curl https://example.com/sitemap.xml
```

站点 URL 优先使用 Astro 请求上下文中的站点地址；如果没有配置，则根据 Memos 实例信息或当前请求推断。

### Web App Manifest

```http
GET /site.webmanifest
```

返回站点名称、描述、图标和启动地址，用于浏览器安装为应用。

### 搜索重定向

```http
GET /search/:q
```

当 `q` 存在时，返回 `308` 重定向：

```text
/search/example
→ /search/result?q=example
```

当 `q` 为空时，重定向到首页。

## 配置环境变量

复制示例文件：

```bash
cp .env.example .env
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

### 必填配置

```env
MEMOS_API_URL=https://your-memos.example.com/api/v1
```

`MEMOS_API_URL` 是 Memos API 地址，通常以 `/api/v1` 结尾。部署环境必须能够访问此地址。

### 内容筛选

```env
# 只展示指定用户名的 memo，多个用户名使用英文逗号分隔
MEMOS_CREATORS=kemiao

# 每页请求数量，默认 20
MEMOS_PAGE_SIZE=20
```

留空 `MEMOS_CREATORS` 时展示 API 返回的所有公开 memo。

### 站点信息

```env
MEMOS_TITLE=我的朋友圈
MEMOS_DESCRIPTION=人生如逆旅，我亦是行人。
MEMOS_AVATAR=https://example.com/avatar.png

# 支持文字或图片 URL
MEMOS_LOGO=<K.M/>
```

- `MEMOS_TITLE`：站点标题、页头标题和 SEO 标题
- `MEMOS_DESCRIPTION`：站点描述、SEO 描述和 Feed 描述
- `MEMOS_AVATAR`：站点头像，同时可用于 SEO 和 Web App 图标
- `MEMOS_LOGO`：页头 Logo；填文字显示文字徽章，填 `http://` 或 `https://` URL 显示图片；留空时使用站点头像

### memo 作者覆盖

如果希望页面上的所有 memo 使用统一昵称和头像，可以配置：

```env
MEMOS_CREATOR_NAME=克喵
MEMOS_CREATOR_AVATAR=https://example.com/creator-avatar.png
```

这两个变量会覆盖首页、分页、标签、搜索结果、详情页和评论中的作者信息。只配置其中一个时，只覆盖对应字段。

### 页头社会化链接

留空或注释变量即可隐藏对应图标：

```env
SOCIAL_RSS_URL=/rss.xml
SOCIAL_X_URL=https://x.com/example
SOCIAL_GITHUB_URL=https://github.com/example
SOCIAL_TELEGRAM_URL=https://t.me/example
SOCIAL_QQ_URL=https://qm.qq.com/q/example
SOCIAL_EMAIL_URL=mailto:hello@example.com
SOCIAL_BILIBILI_URL=https://space.bilibili.com/example
```

### 其他配置

```env
# 页面语言，默认 en
LOCALE=zh-CN

# Twitter/X 卡片使用的用户名，可选
TWITTER=example

# 可信管理员使用的原始 HTML 注入
HEADER_INJECT=
FOOTER_INJECT=

# 友链 API
FRIEND_LINK_API_URL=https://blog-api.example.com/
FRIEND_LINK_APPLY_URL=https://blog-api.example.com/friend-apply

# 设置后在主导航显示 Blog
BLOG_URL=https://blog.example.com/

# 覆盖 Astro 自动识别的部署适配器
SERVER_ADAPTER=
```

修改环境变量后，开发环境需要重启服务；生产环境需要重新构建或重新部署。不要将包含密钥、令牌或私有地址的 `.env` 提交到仓库。

完整示例见 [`.env.example`](./.env.example)。

## 本地开发

### 环境要求

- Node.js LTS
- pnpm 11
- 可访问的 Memos API

安装依赖：

```bash
pnpm install
```

配置 `.env` 后启动开发服务器：

```bash
pnpm dev
```

访问：

```text
http://localhost:4321
```

常用命令：

```bash
pnpm build       # 构建生产版本
pnpm preview     # 预览生产构建
pnpm lint        # ESLint 检查
pnpm typecheck   # TypeScript 检查
pnpm test        # Vitest 测试
pnpm lint:fix    # 自动修复 ESLint 问题
```

## 部署方式

### 方式一：Docker

项目提供多阶段 Dockerfile，最终运行 Astro 的 Node standalone server。

构建镜像：

```bash
docker build -t broadcast-channel .
```

启动容器：

```bash
docker run -d \
  --name broadcast-channel \
  --restart unless-stopped \
  -p 4321:4321 \
  -e MEMOS_API_URL=https://your-memos.example.com/api/v1 \
  -e MEMOS_TITLE="我的朋友圈" \
  broadcast-channel
```

访问：

```text
http://localhost:4321
```

也可以使用预构建镜像：

```bash
docker pull ghcr.io/miantiao-me/broadcastchannel:main

docker run -d \
  --name broadcast-channel \
  --restart unless-stopped \
  -p 4321:4321 \
  -e MEMOS_API_URL=https://your-memos.example.com/api/v1 \
  ghcr.io/miantiao-me/broadcastchannel:main
```

Docker 容器默认监听 `0.0.0.0:4321`，可以在反向代理中配置 HTTPS 和自定义域名。

### 方式二：Node.js / VPS

构建并启动：

```bash
pnpm install --frozen-lockfile
pnpm build
HOST=0.0.0.0 PORT=4321 node ./dist/server/entry.mjs
```

Windows PowerShell：

```powershell
pnpm install --frozen-lockfile
pnpm build
$env:HOST = "0.0.0.0"
$env:PORT = "4321"
node ./dist/server/entry.mjs
```

生产环境建议使用 systemd、PM2 或其他进程管理器，并通过 Nginx、Caddy 等反向代理提供 HTTPS。

### 方式三：Vercel

1. Fork 或导入本仓库。
2. 在 Vercel 创建项目并选择该仓库。
3. Framework Preset 选择 Astro，构建命令使用 `pnpm build`。
4. 在项目设置中添加 `MEMOS_API_URL` 及其他环境变量。
5. 部署项目并绑定域名。

项目配置已包含 Vercel SSR 适配器。Vercel 的环境变量修改后需要重新部署。

### 方式四：Netlify

1. 在 Netlify 导入本仓库。
2. 设置构建命令：`pnpm build`。
3. 设置发布方式为 Astro SSR 对应的部署配置。
4. 添加 `MEMOS_API_URL` 等环境变量。
5. 触发部署并绑定域名。

项目配置已包含 Netlify 适配器。

### 方式五：Cloudflare Workers

Cloudflare 部署请使用 **Workers**，不要使用 Cloudflare Pages SSR。项目当前 Astro 和 Cloudflare 适配器配置不支持 Cloudflare Pages SSR。

登录 Wrangler：

```bash
pnpm exec wrangler login
```

构建并部署：

```bash
$env:SERVER_ADAPTER="cloudflare_workers"; pnpm build
pnpm exec wrangler deploy
```

Linux/macOS：

```bash
SERVER_ADAPTER=cloudflare_workers pnpm build
pnpm exec wrangler deploy
```

在 Cloudflare Workers 控制台配置运行时环境变量，或使用 Wrangler：

```bash
pnpm exec wrangler secret put MEMOS_API_URL
```

非敏感配置也可以根据部署策略写入 Workers Variables。项目的 [`wrangler.jsonc`](./wrangler.jsonc) 已配置静态资源绑定和 Node.js 兼容性。

### 方式六：EdgeOne

项目支持 EdgeOne，并会根据 EdgeOne provider 或平台提供的 `EDGEONE_PROJECT_ID`、`EO_MAKERS` 变量自动选择适配器。

如果平台没有正确识别，可以在构建时显式指定：

```bash
SERVER_ADAPTER=edgeone pnpm build
```

## 主题与样式

基础主题始终加载。可以通过 `HEADER_INJECT` 加载一个内置主题覆盖文件：

| 主题             | 文件                           |
| ---------------- | ------------------------------ |
| Sepia            | `/themes/sepia.css`            |
| Aria             | `/themes/aria.css`             |
| Terminal Amber   | `/themes/terminal-amber.css`   |
| Terminal Green   | `/themes/terminal-green.css`   |
| Terminal Cyan    | `/themes/terminal-cyan.css`    |
| Terminal Magenta | `/themes/terminal-magenta.css` |
| HN News          | `/themes/hn-news.css`          |
| ZAE              | `/themes/zae.css`              |

示例：

```env
HEADER_INJECT=<link rel="stylesheet" href="/themes/aria.css">
```

不要直接加载 `/themes/terminal-base.css`，它是 Terminal 主题的基础样式，不是独立主题入口。主题细节见 [`THEMES.md`](./THEMES.md)，来源说明见 [`NOTICE.md`](./NOTICE.md)。

## 常见问题

### 页面没有内容

依次检查：

1. `MEMOS_API_URL` 是否包含正确的 `/api/v1`。
2. 部署环境是否可以访问 Memos API。
3. Memos 中的 memo 是否设置为公开。
4. `MEMOS_CREATORS` 是否过滤掉了实际用户名。
5. 修改环境变量后是否重新启动、重新构建或重新部署。

### 头像或 Logo 没有更新

确认 URL 可以从浏览器和部署环境直接访问，并检查 Logo 的格式：

```env
MEMOS_LOGO=<K.M/>
```

文字会渲染为文字徽章；图片地址必须以 `http://` 或 `https://` 开头。修改 `.env` 后重启开发服务，生产环境重新部署。

### RSS 或 Sitemap 地址不正确

部署在反向代理或自定义域名后，请确认代理正确转发 `Host` 和协议相关请求头。也可以设置 Astro 的站点地址配置，让生成的绝对 URL 更稳定。

### Cloudflare 部署失败

确认使用的是 Cloudflare Workers，而不是 Cloudflare Pages SSR，并使用：

```bash
SERVER_ADAPTER=cloudflare_workers pnpm build
pnpm exec wrangler deploy
```

## 项目结构

```text
src/
├─ components/       页面组件
├─ layouts/          Astro 页面布局
├─ lib/
│  ├─ env.ts         环境变量读取
│  └─ memos/         Memos API、缓存、解析和 Feed 数据
├─ pages/            页面路由与公开接口
└─ styles/           基础主题和内容样式
public/
├─ themes/           内置主题覆盖样式
└─ favicon.svg       默认站点图标
```

## 许可与来源

主题和样式灵感来源见 [`NOTICE.md`](./NOTICE.md)。项目包含 Bear Blog、Aria、Terminal 等设计灵感的独立实现，与相关项目不构成官方关联。
