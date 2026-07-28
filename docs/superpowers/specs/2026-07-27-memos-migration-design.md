# BroadcastChannel → Memos 数据源迁移设计文档

> 日期：2026-07-27  
> 范围：将 `E:\kmoretti-github\blog_api\memos` 项目的内容源从 Telegram Channel 切换为 Memos 0.29.1 实例  
> 决策：方案 B（彻底重写 Memos 层）

---

## 1. 项目背景与目标

### 1.1 当前状态

项目当前是基于 Astro SSR 的 Telegram Channel 转微博客模板（broadcast-channel v0.3.0）。所有内容通过抓取 `t.me/s/<CHANNEL>` 公开页面获得。

### 1.2 改造目标

- 内容源从 Telegram 切换为 Memos 0.29.1 实例 `https://mm.2005815.xyz/`；
- 使用 Memos 原生评论（只读展示）；
- 使用 Memos 原生 reactions（只读展示，聚合计数）；
- 支持 Markdown 富文本渲染，识别行首 `#标签`；
- 支持 `pinned` 置顶效果；
- 使用数据里的 `tags` 字段；
- 渲染 `attachments` 附件（图片、视频、音频、文件）；
- 图片继续使用现有原生 popover 灯箱；
- 渲染位置卡片；
- 保留搜索功能，改为 Memos 数据；
- 友链页面接入 `https://blog-api.2005815.xyz/api/public/friend/`；
- 新增暗色/亮色模式切换，适配多端布局。

### 1.3 非目标

- 不写回 Memos（无 Token，评论和 reactions 仅展示，不交互）；
- 不保留 Telegram 相关代码；
- 不保留静态代理 `/static/*`；
- 不替换现有主题系统，只增加 dark mode 变量覆盖。

---

## 2. 关键约束与假设

- Memos 实例公开读取，无需 Access Token；
- 评论读取无需 Token；
- 作者过滤：配置 `MEMOS_CREATORS` 时只展示这些用户的 PUBLIC memo，否则展示所有 PUBLIC memo 并显示作者；
- 友链 API 基础 URL：`https://blog-api.2005815.xyz/`；
- 页面默认主题跟随系统，用户切换后写入 `localStorage`；
- 分页使用 Memos `pageToken` 游标，本站只做「下一页 + 首页」。

---

## 3. 整体架构

```text
Astro pages (index / posts / before / after / search / links)
    │
    ▼
src/lib/memos/index.ts
    │
    ├── src/lib/memos/api.ts       ──► ofetch ──► https://mm.2005815.xyz/api/v1/...
    ├── src/lib/memos/cache.ts     ──► ocache 5min
    └── src/lib/memos/parse.ts     ──► 转成内部 Memo 类型
    │
    ▼
components/MemoEntry.astro / MemosPage.astro
```

### 3.1 废弃模块

- `src/lib/telegram/` 整个目录删除；
- `src/pages/static/[...url].ts` 删除；
- `src/lib/static-proxy.ts` 删除；
- Telegram 评论 Widget、反应、频道描述相关代码；
- `CHANNEL`、`TELEGRAM_HOST`、`STATIC_PROXY`、`TARGET_WHITELIST` 等环境变量。

### 3.2 新增模块

- `src/lib/memos/`：Memos 数据获取、解析、渲染；
- `src/components/ThemeToggle.astro`：明暗切换按钮；
- `src/components/CreatorAvatar.astro`：作者头像；
- `src/components/MemoEntry.astro`：单条 memo 渲染；
- `src/components/MemosPage.astro`：列表容器与分页。

---

## 4. 类型系统

`src/types.ts` 重写为 Memos -centric 类型：

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
  state: 'NORMAL' | 'ARCHIVED'
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
```

---

## 5. 模块职责

### 5.1 `src/lib/memos/api.ts`

封装所有 Memos API 调用：

| 函数                   | 端点                               | 说明                                         |
| ---------------------- | ---------------------------------- | -------------------------------------------- |
| `listMemos(params)`    | `GET /api/v1/memos`                | 列表，支持 `pageSize`、`pageToken`、`filter` |
| `getMemo(id)`          | `GET /api/v1/memos/{id}`           | 单条 memo                                    |
| `searchMemos(q)`       | `GET /api/v1/memos?filter=...`     | 使用 CEL 过滤 content/tags                   |
| `listComments(id)`     | `GET /api/v1/memos/{id}/comments`  | 评论列表                                     |
| `listReactions(id)`    | `GET /api/v1/memos/{id}/reactions` | 反应列表（备用，列表接口已内嵌）             |
| `getInstanceProfile()` | `GET /api/v1/instance/profile`     | 实例信息                                     |
| `getUser(username)`    | `GET /api/v1/users/{username}`     | 作者详情                                     |

### 5.2 `src/lib/memos/cache.ts`

使用 `ocache` 对以下请求做 5 分钟服务端缓存：

- `listMemos` / `searchMemos`（按 URL+参数 key）；
- `getMemo`（按 id key）；
- `listComments`（按 id key）；
- `getInstanceProfile`（全局 key）。

### 5.3 `src/lib/memos/parse.ts`

把 API 原始类型转换为 `src/types.ts` 内部类型：

- 提取 `shortId`（`name` 去掉 `memos/` 前缀）；
- 聚合 `reactions` 为 `{ reactionType, count }[]`；
- 转换附件类型；
- 转换位置信息；
- 过滤作者（如配置了 `MEMOS_CREATORS`）。

### 5.4 `src/lib/memos/markdown.ts`

基于 `marked` 渲染：

1. 预处理 `#标签` → `<a class="memo-tag" href="/search/result?q=%23标签">#标签</a>`；
2. `marked.parse()` 渲染 Markdown；
3. 代码块高亮：用 `flourite` 检测语言，`prismjs` 染色；
4. `sanitize-html` 白名单消毒。

### 5.5 `src/lib/memos/render.ts`

- `groupAttachments(attachments)`：按 MIME 类型分为 image/video/audio/other；
- `renderLocation(location)`：返回 OpenStreetMap 链接卡片 HTML；
- `formatFileSize(size)`：字节转 KB/MB。

### 5.6 `src/lib/memos/index.ts`

对外暴露：

- `getMemosInfo(params)`：获取首页/分页/搜索数据；
- `getMemoById(id)`：获取单条 memo 及评论；
- `getMemoComments(id)`：获取评论列表。

---

## 6. 内容渲染

### 6.1 Markdown 正文

- 行首 `#标签` 识别为 Memos 标签链接；
- 标准 Markdown 渲染为 HTML；
- 代码块使用 Prism 高亮；
- 所有 HTML 经过 `sanitize-html` 消毒后 `set:html`。

### 6.2 附件

| MIME 前缀 | 渲染                                 |
| --------- | ------------------------------------ |
| `image/*` | 内联图片，点击打开 popover 灯箱      |
| `video/*` | `<video controls>`                   |
| `audio/*` | `<audio controls>`                   |
| 其他      | 下载卡片（文件名 + 大小 + 下载链接） |

多图布局：单张全宽；2 张 50/50；3 张 33/33/33；4 张 2×2；超过 4 张显示「+N」浮层。

### 6.3 位置卡片

```html
<a
  class="memo-location"
  href="https://www.openstreetmap.org/?mlat=lat&mlon=lon#map=16/lat/lon"
  target="_blank"
  rel="noopener noreferrer"
>
  <Icon name="ri:map-pin-line" />
  <span>{placeholder}</span>
</a>
```

### 6.4 Reactions

- 聚合展示：emoji + 计数；
- 放在正文/附件/位置之后、标签之前；
- 只读，不交互。

### 6.5 评论

- 详情页调用 `getMemoComments(id)`；
- 评论按 `createTime` 升序；
- 每条评论展示作者、时间、Markdown 内容；
- 列表页显示评论数量（通过 comments API 或 memo 的 `relations` 推断，暂以进入详情页后展示为准）。

### 6.6 原文链接

详情页底部固定展示：

```html
<a href="https://mm.2005815.xyz/m/{shortId}" target="_blank" rel="noopener noreferrer">
  前往 Memos 原文评论 / 点赞 →
</a>
```

---

## 7. 页面改造

| 页面                                         | 改造                                                       |
| -------------------------------------------- | ---------------------------------------------------------- |
| `index.astro`                                | `getMemosInfo()`，置顶 memo 排在最前，普通 memo 按时间倒序 |
| `before/[cursor].astro`                      | 使用 `pageToken` 加载更早 memo                             |
| `after/[cursor].astro`                       | 删除该路由；旧的 `/after/*` 301 重定向到首页 `/`           |
| `posts/[id].astro`                           | `getMemoById(id)` + `getMemoComments(id)`                  |
| `search/result.astro`                        | `searchMemos(q)`                                           |
| `tags.astro`                                 | 聚合所有 memo 的 `tags` 展示为标签云                       |
| `links.astro`                                | 调用友链 API 展示                                          |
| `rss.xml.ts` / `rss.json.ts`                 | 数据源改为 Memos                                           |
| `sitemap.xml.ts` / `sitemap/[cursor].xml.ts` | 数据源改为 Memos                                           |
| `site.webmanifest.ts`                        | 标题/头像从 Memos 实例读取                                 |

---

## 8. 明暗模式

- CSS 变量在 `:root` 和 `html.dark` 下分别定义；
- 默认读取 `prefers-color-scheme`；
- 切换按钮固定在右下角（与现有「回到顶部」按钮错开，主题按钮在右下偏上，回到顶部在右下偏下，避免重叠）；
- 用户选择写入 `localStorage`；
- 页面加载时通过内联 `<script>` 立即应用主题类，避免闪烁；
- 图标使用 `ri:sun-line` / `ri:moon-line`。

---

## 9. 搜索与分页

### 9.1 搜索

关键词 `q` 传给 Memos `filter`：

```
content.contains('关键词') || tags.contains('关键词')
```

标签点击：`/search/result?q=%23项目`。

### 9.2 分页

- 使用 Memos `pageToken` 游标；
- 本站只实现「下一页」+「首页」；
- 每页大小 `MEMOS_PAGE_SIZE`，默认 20。

---

## 10. 友链接入

- 端点：`GET https://blog-api.2005815.xyz/api/public/friend/?page=1&page_size=20&status=survival`
- 响应包装：`{ code, message, data: { items, total, page, page_size } }`
- 展示字段：`name`、`link`、`avatar`、`description`
- 申请入口可配置 `FRIEND_LINK_APPLY_URL`

---

## 11. 多端布局

- 小屏 16px 边距，内容区 100% 宽度；
- 大屏 max-width 680px 居中；
- 图片画廊：小屏最多 2 列，大屏 2/3/4 列自适应；
- 搜索框：小屏图标展开，大屏常驻；
- 明暗按钮：小屏 48px 圆形固定右下角；
- 代码块：小屏横向滚动。

---

## 12. 依赖

### 12.1 新增

```bash
pnpm add marked
```

`sanitize-html` 如已存在则不加；`cheerio` 删除。

### 12.2 可删除

- `cheerio`
- 与 Telegram 抓取相关的依赖（如有）。

---

## 13. 环境变量

```bash
# 必填
MEMOS_API_URL=https://mm.2005815.xyz/api/v1

# 可选
MEMOS_CREATORS=kemiao,user2
MEMOS_PAGE_SIZE=20
MEMOS_TITLE=我的朋友圈
MEMOS_DESCRIPTION=
MEMOS_AVATAR=
FRIEND_LINK_API_URL=https://blog-api.2005815.xyz/
FRIEND_LINK_APPLY_URL=https://blog-api.2005815.xyz/friend-apply
```

---

## 14. 测试与验证

- `pnpm typecheck` 通过；
- `pnpm lint` 通过；
- `pnpm build` 通过；
- 首页、详情页、搜索、标签、友链、RSS、Sitemap 均可正常渲染；
- 明暗模式切换正常，刷新不闪烁；
- 多端布局自检通过。

---

## 15. 风险

| 风险                   | 缓解                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| Memos API 返回结构变化 | 使用类型 + parse 层隔离，API 变化时只改 `api.ts` / `parse.ts`；                                |
| 公开接口读取受限       | 当前已验证无需 Token，如后续需 Token 则在 `api.ts` 注入 `MEMOS_ACCESS_TOKEN`；                 |
| 附件签名 URL 过期      | Memos `externalLink` 含过期签名，使用服务端缓存时 URL 也会缓存，必要时缩短缓存时间或代理附件； |
| 评论数量无直接字段     | 详情页加载评论列表，首页不展示评论数。                                                         |
