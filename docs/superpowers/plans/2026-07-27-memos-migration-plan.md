# BroadcastChannel → Memos 数据源迁移实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将项目内容源从 Telegram Channel 切换为 Memos 0.29.1 实例，保留现有 BroadcastChannel 视觉风格并新增明暗模式与多端适配。

**Architecture：** 在 `src/lib/memos/` 下新建 Memos API 客户端、缓存、解析、Markdown 渲染模块；替换 `src/lib/telegram/`；更新 Astro 页面与组件以使用新的 `Memo` 类型；通过 CSS 变量 + `html.dark` 实现主题切换。

**Tech Stack：** Astro 7, TypeScript, Tailwind CSS v4, marked, sanitize-html, prismjs, ofetch, ocache.

---

## 文件结构总览

### 新增文件

- `src/lib/memos/types.ts` — Memos API 原始类型
- `src/lib/memos/api.ts` — API 请求封装
- `src/lib/memos/cache.ts` — ocache 缓存封装
- `src/lib/memos/parse.ts` — API 响应 → 内部类型转换
- `src/lib/memos/markdown.ts` — Markdown 渲染与标签识别
- `src/lib/memos/render.ts` — 附件分组、位置卡片、文件大小
- `src/lib/memos/index.ts` — 对外暴露的查询函数
- `src/components/ThemeToggle.astro` — 明暗切换按钮
- `src/components/CreatorAvatar.astro` — 作者头像
- `src/components/MemoEntry.astro` — 单条 memo 渲染
- `src/components/MemosPage.astro` — 列表容器与分页

### 修改文件

- `src/types.ts` — 替换为 Memos 内部类型
- `src/lib/env.ts` — 新增 Memos 与友链环境变量读取
- `src/lib/feed.ts` — RSS/JSON Feed 改用 Memos 数据
- `src/lib/seo.ts` — SEO 元信息改用 Memos 数据
- `src/middleware.ts` — 移除 Telegram 相关 locals，调整缓存头
- `src/layouts/BaseLayout.astro` — 注入主题脚本与切换按钮
- `src/styles/app/theme.css` — 增加 dark 变量
- `src/styles/app/feed.css` — memo 条目样式
- `src/components/SiteHeader.astro` — 使用实例信息或环境变量
- `src/components/SiteNavigation.astro` — 移除 Telegram 相关导航
- `src/pages/index.astro` — 首页 Memos 列表
- `src/pages/before/[cursor].astro` — 分页
- `src/pages/posts/[id].astro` — 详情页 + 评论
- `src/pages/search/result.astro` — Memos 搜索
- `src/pages/tags.astro` — 标签云
- `src/pages/links.astro` — 友链接入
- `src/pages/rss.xml.ts` / `rss.json.ts` — Feed
- `src/pages/sitemap.xml.ts` / `sitemap/[cursor].xml.ts` — Sitemap
- `src/pages/site.webmanifest.ts` — Manifest
- `.env.example` — 新环境变量示例

### 删除文件

- `src/lib/telegram/`（整个目录）
- `src/lib/static-proxy.ts`
- `src/pages/static/[...url].ts`
- `src/pages/after/[cursor].astro`
- `src/components/ChannelAvatar.astro`
- `src/components/PostEntry.astro`
- `src/components/PostsPage.astro`

---

## Task 1: 依赖调整

**Files:**

- Modify: `package.json`

- [ ] **Step 1: 安装 marked**

Run:

```bash
pnpm add marked
```

- [ ] **Step 2: 移除 cheerio**

Run:

```bash
pnpm remove cheerio
```

- [ ] **Step 3: 重新安装依赖**

Run:

```bash
pnpm install
```

---

## Task 2: 定义 Memos API 原始类型

**Files:**

- Create: `src/lib/memos/types.ts`

- [ ] **Step 1: 写入原始类型**

```ts
export interface MemosAttachment {
  name: string;
  createTime: string;
  filename: string;
  content: string;
  externalLink: string;
  type: string;
  size: string;
  memo: string;
  motionMedia: unknown;
}

export interface MemosRelation {
  memo: { name: string; snippet: string };
  relatedMemo: { name: string; snippet: string };
  type: string;
}

export interface MemosReaction {
  name: string;
  creator: string;
  contentId: string;
  reactionType: string;
  createTime: string;
}

export interface MemosLocation {
  placeholder: string;
  latitude: number;
  longitude: number;
}

export interface MemosProperty {
  hasLink: boolean;
  hasTaskList: boolean;
  hasCode: boolean;
  hasIncompleteTasks: boolean;
  title: string;
}

export interface MemoItem {
  name: string;
  state: string;
  creator: string;
  createTime: string;
  updateTime: string;
  content: string;
  visibility: string;
  tags: string[];
  pinned: boolean;
  attachments: MemosAttachment[];
  relations: MemosRelation[];
  reactions: MemosReaction[];
  property: MemosProperty;
  parent: string;
  snippet: string;
  location: MemosLocation;
}

export interface ListMemosResponse {
  memos: MemoItem[];
  nextPageToken: string;
}

export interface GetInstanceProfileResponse {
  version: string;
  demo: boolean;
  instanceUrl: string;
  admin?: {
    name: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    description: string;
  };
  commit: string;
}

export interface GetUserResponse {
  name: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  description: string;
}
```

---

## Task 3: 定义内部类型

**Files:**

- Modify: `src/types.ts`

- [ ] **Step 1: 替换整个文件内容**

```ts
export interface MemoCreator {
  name: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface MemoAttachment {
  name: string;
  filename: string;
  externalLink: string;
  type: string;
  size: string;
}

export interface MemoReaction {
  reactionType: string;
  count: number;
}

export interface MemoLocation {
  placeholder: string;
  latitude: number;
  longitude: number;
}

export interface Memo {
  id: string;
  shortId: string;
  state: string;
  creator: MemoCreator;
  createTime: string;
  updateTime: string;
  content: string;
  html: string;
  visibility: string;
  tags: string[];
  pinned: boolean;
  attachments: MemoAttachment[];
  reactions: MemoReaction[];
  location?: MemoLocation;
  property: {
    hasLink: boolean;
    hasTaskList: boolean;
    hasCode: boolean;
    hasIncompleteTasks: boolean;
    title?: string;
  };
  snippet: string;
}

export interface MemoComment extends Memo {
  parent: string;
}

export interface MemoInfo {
  memos: Memo[];
  instanceUrl: string;
  title?: string;
  description?: string;
  avatar?: string;
  nextPageToken?: string;
}

export interface FriendLink {
  id: number;
  name: string;
  link: string;
  avatar: string;
  description: string;
  status: string;
  enableRss: boolean;
  updatedAt: number;
  snapshot?: string;
  friendLinkPage?: string;
  feed?: string;
}

export interface FriendLinkResponse {
  code: number;
  message: string;
  data: {
    items: FriendLink[];
    total: number;
    page: number;
    page_size: number;
  };
}

export interface NavItem {
  title: string;
  href: string;
}

export interface SeoMeta {
  title?: string;
  text?: string;
  noindex?: string | boolean;
  nofollow?: string | boolean;
}
```

---

## Task 4: 环境变量读取

**Files:**

- Modify: `src/lib/env.ts`

- [ ] **Step 1: 在文件末尾追加 Memos 与友链相关函数**

```ts
export function getMemosApiUrl(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string {
  return getEnv(env, "MEMOS_API_URL") || "https://mm.2005815.xyz/api/v1";
}

export function getMemosCreators(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string[] {
  const value = getEnv(env, "MEMOS_CREATORS");
  return value
    ? value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
}

export function getMemosPageSize(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): number {
  const value = Number.parseInt(getEnv(env, "MEMOS_PAGE_SIZE") || "20", 10);
  return Number.isNaN(value) || value < 1 ? 20 : value;
}

export function getMemosTitle(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string | undefined {
  return getEnv(env, "MEMOS_TITLE");
}

export function getMemosDescription(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string | undefined {
  return getEnv(env, "MEMOS_DESCRIPTION");
}

export function getMemosAvatar(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string | undefined {
  return getEnv(env, "MEMOS_AVATAR");
}

export function getFriendLinkApiUrl(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string {
  return getEnv(env, "FRIEND_LINK_API_URL") || "https://blog-api.2005815.xyz/";
}

export function getFriendLinkApplyUrl(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string | undefined {
  return getEnv(env, "FRIEND_LINK_APPLY_URL");
}
```

- [ ] **Step 2: 移除 Telegram 相关函数**

删除 `getTelegramHost`、`getStaticProxy`、`getTargetWhitelist`、`getChannel` 等与 Telegram 相关的函数（或整段替换文件，视现有内容而定）。

---

## Task 5: Memos API 请求封装

**Files:**

- Create: `src/lib/memos/api.ts`

- [ ] **Step 1: 写入 API 请求函数**

```ts
import { ofetch } from "ofetch";
import { getMemosApiUrl } from "../env.ts";
import type {
  GetInstanceProfileResponse,
  GetUserResponse,
  ListMemosResponse,
  MemoItem,
} from "./types.ts";

function getApiBaseUrl(): string {
  return getMemosApiUrl().replace(/\/$/, "");
}

function memosFetch<T>(
  path: string,
  query: Record<string, string | number | undefined> = {},
): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }
  const queryString = params.toString();
  const url = `${getApiBaseUrl()}${path}${queryString ? `?${queryString}` : ""}`;
  return ofetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "BroadcastChannel-Memos/1.0",
    },
    retry: 2,
    timeout: 15000,
  });
}

export function listMemos(
  params: {
    pageSize?: number;
    pageToken?: string;
    filter?: string;
    orderBy?: string;
  } = {},
): Promise<ListMemosResponse> {
  return memosFetch<ListMemosResponse>("/memos", {
    pageSize: params.pageSize,
    pageToken: params.pageToken,
    filter: params.filter,
    orderBy: params.orderBy || "pinned desc, create_time desc",
  });
}

export function getMemo(id: string): Promise<MemoItem> {
  return memosFetch<MemoItem>(`/memos/${id}`);
}

export function searchMemos(
  q: string,
  params: { pageSize?: number; pageToken?: string } = {},
): Promise<ListMemosResponse> {
  const escaped = q.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const filter = `content.contains('${escaped}') || tags.contains('${escaped}')`;
  return listMemos({ ...params, filter });
}

export function listComments(
  id: string,
  params: { pageSize?: number; pageToken?: string } = {},
): Promise<ListMemosResponse> {
  return memosFetch<ListMemosResponse>(`/memos/${id}/comments`, {
    pageSize: params.pageSize,
    pageToken: params.pageToken,
    orderBy: "create_time asc",
  });
}

export function listReactions(
  id: string,
): Promise<{ reactions: { reactionType: string }[]; totalSize: number }> {
  return memosFetch<{
    reactions: { reactionType: string }[];
    totalSize: number;
  }>(`/memos/${id}/reactions`);
}

export function getInstanceProfile(): Promise<GetInstanceProfileResponse> {
  return memosFetch<GetInstanceProfileResponse>("/instance/profile");
}

export function getUser(username: string): Promise<GetUserResponse> {
  return memosFetch<GetUserResponse>(`/users/${username}`);
}
```

---

## Task 6: 缓存封装

**Files:**

- Create: `src/lib/memos/cache.ts`

- [ ] **Step 1: 写入缓存封装**

```ts
import { defineCachedFunction } from "ocache";
import * as api from "./api.ts";

const cacheOptions = { maxAge: 1000 * 60 * 5 };

export const getCachedListMemos = defineCachedFunction(api.listMemos, {
  ...cacheOptions,
  key: (params: Parameters<typeof api.listMemos>[0]) =>
    `memos:list:${JSON.stringify(params)}`,
});

export const getCachedGetMemo = defineCachedFunction(api.getMemo, {
  ...cacheOptions,
  key: (id: string) => `memos:${id}`,
});

export const getCachedSearchMemos = defineCachedFunction(api.searchMemos, {
  ...cacheOptions,
  key: (q: string, params: Parameters<typeof api.searchMemos>[1]) =>
    `memos:search:${q}:${JSON.stringify(params)}`,
});

export const getCachedListComments = defineCachedFunction(api.listComments, {
  ...cacheOptions,
  key: (id: string, params: Parameters<typeof api.listComments>[1]) =>
    `memos:comments:${id}:${JSON.stringify(params)}`,
});

export const getCachedInstanceProfile = defineCachedFunction(
  api.getInstanceProfile,
  {
    ...cacheOptions,
    key: () => "memos:instance:profile",
  },
);
```

---

## Task 7: Markdown 渲染

**Files:**

- Create: `src/lib/memos/markdown.ts`

- [ ] **Step 1: 写入 Markdown 渲染函数**

```ts
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { highlightCode } from "../prism.ts";

const tagRegex = /(^|\s)#([\u4e00-\u9fa5a-zA-Z0-9_\-]+)/g;

function transformTags(content: string): string {
  return content.replace(tagRegex, (match, prefix, tag) => {
    return `${prefix}<a href="/search/result?q=%23${encodeURIComponent(tag)}" class="memo-tag">#${tag}</a>`;
  });
}

function transformCodeBlocks(html: string): string {
  return html
    .replace(
      /<pre><code class="language-([^"]*)">([\s\S]*?)<\/code><\/pre>/g,
      (_, lang, code) => {
        const highlighted = highlightCode(
          decodeHtmlEntities(code),
          lang || "text",
        );
        return `<pre class="language-${lang || "text"}"><code class="language-${lang || "text"}">${highlighted}</code></pre>`;
      },
    )
    .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (_, code) => {
      const highlighted = highlightCode(decodeHtmlEntities(code), "text");
      return `<pre class="language-text"><code class="language-text">${highlighted}</code></pre>`;
    });
}

function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function sanitizeLinks(html: string): string {
  return html.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
}

export function renderMarkdown(content: string): string {
  const withTags = transformTags(content);
  const rawHtml = marked.parse(withTags, { async: false }) as string;
  const withCode = transformCodeBlocks(rawHtml);
  const withLinks = sanitizeLinks(withCode);
  return sanitizeHtml(withLinks, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "a",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "del",
      "img",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "class"],
      code: ["class"],
      pre: ["class"],
      img: ["src", "alt", "title"],
    },
    allowedClasses: {
      a: ["memo-tag"],
      code: ["language-*"],
      pre: ["language-*"],
    },
  });
}
```

- [ ] **Step 2: 更新 prism.ts 的导出**

确认 `src/lib/prism.ts` 导出 `highlightCode` 函数。如果不存在，创建或修改：

```ts
import flourite from "flourite";
import Prism from "prismjs";
import loadLanguages from "prismjs-components-importer";

export function highlightCode(code: string, lang: string): string {
  const detected = lang === "text" ? flourite(code).language : lang;
  const language = loadLanguages(detected) ? detected : "text";
  return Prism.highlight(
    code,
    Prism.languages[language] || Prism.languages.text,
    language,
  );
}
```

---

## Task 8: 渲染辅助函数

**Files:**

- Create: `src/lib/memos/render.ts`

- [ ] **Step 1: 写入辅助函数**

```ts
import type { MemoAttachment, MemoLocation } from "../../types.ts";

export interface GroupedAttachments {
  images: MemoAttachment[];
  videos: MemoAttachment[];
  audios: MemoAttachment[];
  others: MemoAttachment[];
}

export function groupAttachments(
  attachments: MemoAttachment[],
): GroupedAttachments {
  return attachments.reduce(
    (groups, attachment) => {
      const type = attachment.type || "";
      if (type.startsWith("image/")) {
        groups.images.push(attachment);
      } else if (type.startsWith("video/")) {
        groups.videos.push(attachment);
      } else if (type.startsWith("audio/")) {
        groups.audios.push(attachment);
      } else {
        groups.others.push(attachment);
      }
      return groups;
    },
    { images: [], videos: [], audios: [], others: [] } as GroupedAttachments,
  );
}

export function formatFileSize(size: string): string {
  const bytes = Number.parseInt(size, 10);
  if (Number.isNaN(bytes)) return size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getOpenStreetMapUrl(location: MemoLocation): string {
  const { latitude, longitude } = location;
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
}

export function getMemoPublicUrl(instanceUrl: string, shortId: string): string {
  const base = instanceUrl.replace(/\/$/, "");
  return `${base}/m/${shortId}`;
}
```

---

## Task 9: 解析与数据聚合

**Files:**

- Create: `src/lib/memos/parse.ts`

- [ ] **Step 1: 写入解析函数**

```ts
import type {
  Memo,
  MemoAttachment,
  MemoComment,
  MemoCreator,
  MemoInfo,
  MemoReaction,
} from "../../types.ts";
import type { MemoItem, MemosAttachment, MemosReaction } from "./types.ts";
import { renderMarkdown } from "./markdown.ts";
import { getMemosCreators } from "../env.ts";

function parseAttachment(a: MemosAttachment): MemoAttachment {
  return {
    name: a.name,
    filename: a.filename,
    externalLink: a.externalLink,
    type: a.type,
    size: a.size,
  };
}

function aggregateReactions(reactions: MemosReaction[]): MemoReaction[] {
  const map = new Map<string, number>();
  for (const r of reactions) {
    map.set(r.reactionType, (map.get(r.reactionType) || 0) + 1);
  }
  return Array.from(map.entries()).map(([reactionType, count]) => ({
    reactionType,
    count,
  }));
}

function parseCreator(creatorName: string): MemoCreator {
  const username = creatorName.replace(/^users\//, "");
  return { name: creatorName, username };
}

export function parseMemo(item: MemoItem): Memo {
  const shortId = item.name.replace(/^memos\//, "");
  return {
    id: item.name,
    shortId,
    state: item.state,
    creator: parseCreator(item.creator),
    createTime: item.createTime,
    updateTime: item.updateTime,
    content: item.content,
    html: renderMarkdown(item.content),
    visibility: item.visibility,
    tags: item.tags || [],
    pinned: item.pinned || false,
    attachments: (item.attachments || []).map(parseAttachment),
    reactions: aggregateReactions(item.reactions || []),
    location: item.location?.placeholder ? item.location : undefined,
    property: item.property || {
      hasLink: false,
      hasTaskList: false,
      hasCode: false,
      hasIncompleteTasks: false,
      title: "",
    },
    snippet: item.snippet || item.content.slice(0, 200),
  };
}

export function parseComment(item: MemoItem): MemoComment {
  return {
    ...parseMemo(item),
    parent: item.parent || "",
  };
}

export function filterByCreators(memos: Memo[]): Memo[] {
  const creators = getMemosCreators();
  if (creators.length === 0) return memos;
  return memos.filter((m) => creators.includes(m.creator.username));
}

export function buildMemoInfo(
  response: { memos: MemoItem[]; nextPageToken?: string },
  instanceUrl: string,
): MemoInfo {
  const allMemos = response.memos.map(parseMemo);
  const filtered = filterByCreators(allMemos);
  return {
    memos: filtered,
    instanceUrl,
    nextPageToken: response.nextPageToken,
  };
}
```

---

## Task 10: 对外查询接口

**Files:**

- Create: `src/lib/memos/index.ts`

- [ ] **Step 1: 写入查询函数**

```ts
import { getMemosPageSize } from "../env.ts";
import * as cache from "./cache.ts";
import { buildMemoInfo, parseComment, parseMemo } from "./parse.ts";
import {
  getOpenStreetMapUrl,
  getMemoPublicUrl,
  groupAttachments,
  formatFileSize,
} from "./render.ts";
import type { Memo, MemoComment, MemoInfo } from "../../types.ts";

export async function getMemosInfo(
  params: { pageToken?: string; q?: string } = {},
): Promise<MemoInfo> {
  const pageSize = getMemosPageSize();
  const instance = await cache.getCachedInstanceProfile();
  const queryParams = { pageSize, pageToken: params.pageToken };
  const response = params.q
    ? await cache.getCachedSearchMemos(params.q, queryParams)
    : await cache.getCachedListMemos(queryParams);
  return buildMemoInfo(response, instance.instanceUrl);
}

export async function getMemoById(
  id: string,
): Promise<{ memo: Memo; comments: MemoComment[] }> {
  const [rawMemo, rawComments, instance] = await Promise.all([
    cache.getCachedGetMemo(id),
    cache.getCachedListComments(id, { pageSize: 100 }),
    cache.getCachedInstanceProfile(),
  ]);
  const memo = parseMemo(rawMemo);
  const comments = (rawComments.memos || []).map(parseComment);
  return { memo, comments };
}

export async function getMemoComments(id: string): Promise<MemoComment[]> {
  const response = await cache.getCachedListComments(id, { pageSize: 100 });
  return (response.memos || []).map(parseComment);
}

export {
  getOpenStreetMapUrl,
  getMemoPublicUrl,
  groupAttachments,
  formatFileSize,
};
```

---

## Task 11: 实例信息获取

**Files:**

- Create: `src/lib/memos/instance.ts`

- [ ] **Step 1: 写入站点信息函数**

```ts
import { getMemosAvatar, getMemosDescription, getMemosTitle } from "../env.ts";
import * as cache from "./cache.ts";

export interface SiteInfo {
  title: string;
  description: string;
  avatar: string;
  instanceUrl: string;
}

export async function getSiteInfo(): Promise<SiteInfo> {
  const profile = await cache.getCachedInstanceProfile();
  const envTitle = getMemosTitle();
  const envDescription = getMemosDescription();
  const envAvatar = getMemosAvatar();
  return {
    title:
      envTitle ||
      profile.admin?.displayName ||
      profile.admin?.username ||
      "Memos",
    description: envDescription || profile.admin?.description || "",
    avatar: envAvatar || profile.admin?.avatarUrl || "",
    instanceUrl: profile.instanceUrl,
  };
}
```

---

## Task 12: 更新 feed.ts

**Files:**

- Modify: `src/lib/feed.ts`

- [ ] **Step 1: 重写 feed 数据组装函数**

```ts
import { getMemoPublicUrl } from "./memos/render.ts";
import type { Memo, MemoInfo } from "../types.ts";

export interface FeedMemo {
  id: string;
  title: string;
  link: string;
  pubDate: Date;
  content: string;
  snippet: string;
}

export function buildFeedMemos(info: MemoInfo): FeedMemo[] {
  return info.memos.map((memo: Memo) => {
    const title =
      memo.property.title ||
      memo.snippet.slice(0, 60) ||
      `Memo ${memo.shortId}`;
    return {
      id: memo.id,
      title,
      link: getMemoPublicUrl(info.instanceUrl, memo.shortId),
      pubDate: new Date(memo.createTime),
      content: memo.html,
      snippet: memo.snippet,
    };
  });
}
```

---

## Task 13: 更新 seo.ts

**Files:**

- Modify: `src/lib/seo.ts`

- [ ] **Step 1: 调整 SEO 函数使用新的 SiteInfo**

```ts
import type { SiteInfo } from "./memos/instance.ts";

export function getSiteMeta(site: SiteInfo) {
  return {
    title: site.title,
    description: site.description,
    image: site.avatar,
    url: site.instanceUrl,
  };
}
```

---

## Task 14: 更新 middleware.ts

**Files:**

- Modify: `src/middleware.ts`

- [ ] **Step 1: 移除 Telegram 相关逻辑**

删除 `RSS_PREFIX` / `RSS_URL` 中与 Telegram 频道相关的逻辑，只保留：

```ts
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const url = new URL(context.request.url);

  if (url.pathname.startsWith("/search/%23")) {
    const tag = decodeURIComponent(url.pathname.replace("/search/%23", ""));
    return context.redirect(
      `/search/result?q=%23${encodeURIComponent(tag)}`,
      301,
    );
  }

  if (response.status >= 200 && response.status < 400) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      response.headers.set("Speculation-Rules", "/rules/prefetch.json");
      response.headers.set(
        "Cache-Control",
        "public, max-age=300, s-maxage=300",
      );
    }
  }

  return response;
});
```

---

## Task 15: 创建主题切换组件

**Files:**

- Create: `src/components/ThemeToggle.astro`

- [ ] **Step 1: 写入组件**

```astro
---
---
<button
  id="theme-toggle"
  aria-label="切换主题"
  class="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg)] text-[var(--text)] shadow-lg border border-[var(--border)] md:bottom-24 md:right-6"
>
  <span class="theme-icon-light"><Icon name="ri:sun-line" class="h-6 w-6" /></span>
  <span class="theme-icon-dark hidden"><Icon name="ri:moon-line" class="h-6 w-6" /></span>
</button>

<script is:inline>
  (function () {
    const root = document.documentElement
    const toggle = document.getElementById('theme-toggle')
    const lightIcon = toggle?.querySelector('.theme-icon-light')
    const darkIcon = toggle?.querySelector('.theme-icon-dark')
    const stored = localStorage.getItem('theme')
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = stored ? stored === 'dark' : systemDark

    function applyTheme(dark) {
      if (dark) {
        root.classList.add('dark')
        lightIcon?.classList.add('hidden')
        darkIcon?.classList.remove('hidden')
      }
      else {
        root.classList.remove('dark')
        lightIcon?.classList.remove('hidden')
        darkIcon?.classList.add('hidden')
      }
    }

    applyTheme(isDark)

    toggle?.addEventListener('click', () => {
      const dark = !root.classList.contains('dark')
      applyTheme(dark)
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    })
  })()
</script>
```

---

## Task 16: 更新 BaseLayout.astro

**Files:**

- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: 注入主题脚本并引入 ThemeToggle**

在 `<head>` 内添加内联主题脚本（避免闪烁）：

```astro
<script is:inline>
  (function () {
    const stored = localStorage.getItem('theme')
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (stored ? stored === 'dark' : systemDark) {
      document.documentElement.classList.add('dark')
    }
  })()
</script>
```

- [ ] **Step 2: 在页面底部引入 ThemeToggle**

在 `</body>` 前引入：

```astro
<ThemeToggle />
```

- [ ] **Step 3: 导入 ThemeToggle**

```astro
import ThemeToggle from '../components/ThemeToggle.astro'
```

---

## Task 17: 更新 theme.css

**Files:**

- Modify: `src/styles/app/theme.css`

- [ ] **Step 1: 添加 dark 变量覆盖**

在现有 `:root` 变量之后追加：

```css
html.dark {
  --bg: #0a0a0a;
  --bg-soft: #111111;
  --bg-mute: #1a1a1a;
  --text: #ffffff;
  --text-muted: #999999;
  --text-subtle: #666666;
  --link: #7c9bd6;
  --border: #2a2a2a;
  --shadow: rgba(0, 0, 0, 0.5);
}
```

---

## Task 18: 创建 CreatorAvatar.astro

**Files:**

- Create: `src/components/CreatorAvatar.astro`

- [ ] **Step 1: 写入组件**

```astro
---
import { Icon } from 'astro-icon/components'
import type { MemoCreator } from '../types.ts'

interface Props {
  creator: MemoCreator
}

const { creator } = Astro.props
---
<div class="creator-avatar flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--bg-mute)]">
  {creator.avatarUrl ? (
    <img src={creator.avatarUrl} alt={creator.displayName || creator.username} class="h-full w-full object-cover" loading="lazy" />
  ) : (
    <Icon name="ri:user-line" class="h-6 w-6 text-[var(--text-muted)]" />
  )}
</div>
```

---

## Task 19: 创建 MemoEntry.astro

**Files:**

- Create: `src/components/MemoEntry.astro`

- [ ] **Step 1: 写入单条 memo 组件**

```astro
---
import { Icon } from 'astro-icon/components'
import type { Memo } from '../types.ts'
import CreatorAvatar from './CreatorAvatar.astro'
import { formatRelativeTime } from '../lib/post-ui.ts'
import { groupAttachments, getOpenStreetMapUrl, getMemoPublicUrl } from '../lib/memos/index.ts'

interface Props {
  memo: Memo
  instanceUrl: string
  showComments?: boolean
}

const { memo, instanceUrl, showComments = false } = Astro.props
const { images, videos, audios, others } = groupAttachments(memo.attachments)
const publicUrl = getMemoPublicUrl(instanceUrl, memo.shortId)
---

<article class="memo-entry" data-memo-id={memo.shortId}>
  <header class="memo-header flex items-center gap-3">
    <CreatorAvatar creator={memo.creator} />
    <div class="memo-meta">
      <div class="memo-author font-medium text-[var(--text)]">
        {memo.creator.displayName || memo.creator.username}
      </div>
      <a href={`/posts/${memo.shortId}`} class="memo-time text-sm text-[var(--text-muted)] hover:text-[var(--link)]">
        <time datetime={memo.createTime}>{formatRelativeTime(memo.createTime)}</time>
      </a>
    </div>
    {memo.pinned && <span class="memo-pinned ml-auto text-xs text-[var(--text-muted)]"><Icon name="ri:pushpin-line" class="inline h-4 w-4" /> 置顶</span>}
  </header>

  <div class="memo-content prose prose-sm max-w-none text-[var(--text)]" set:html={memo.html} />

  {images.length > 0 && (
    <div class={`memo-images grid gap-2 mt-3 ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
      {images.map((img, idx) => (
        <button
          type="button"
          class="memo-image-button relative overflow-hidden rounded-lg bg-[var(--bg-mute)] aspect-square"
          popovertarget={`lightbox-${memo.shortId}-${idx}`}
          aria-label="查看大图"
        >
          <img src={img.externalLink} alt={img.filename} class="h-full w-full object-cover" loading="lazy" />
          {idx === 3 && images.length > 4 && (
            <span class="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-lg font-bold">+{images.length - 4}</span>
          )}
        </button>
      ))}
    </div>
  )}

  {videos.length > 0 && videos.map(video => (
    <video controls class="memo-video mt-3 w-full rounded-lg" preload="metadata">
      <source src={video.externalLink} type={video.type} />
    </video>
  ))}

  {audios.length > 0 && audios.map(audio => (
    <audio controls class="memo-audio mt-3 w-full" preload="metadata">
      <source src={audio.externalLink} type={audio.type} />
    </audio>
  ))}

  {others.length > 0 && (
    <div class="memo-files mt-3 space-y-2">
      {others.map(file => (
        <a href={file.externalLink} download={file.filename} class="memo-file flex items-center gap-2 rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--bg-soft)]">
          <Icon name="ri:file-download-line" class="h-5 w-5 text-[var(--text-muted)]" />
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm text-[var(--text)]">{file.filename}</div>
            <div class="text-xs text-[var(--text-muted)]">{formatFileSize(file.size)}</div>
          </div>
        </a>
      ))}
    </div>
  )}

  {memo.location && (
    <a href={getOpenStreetMapUrl(memo.location)} target="_blank" rel="noopener noreferrer" class="memo-location mt-3 flex items-center gap-2 rounded-lg bg-[var(--bg-soft)] p-3 text-sm text-[var(--text-muted)] hover:text-[var(--link)]">
      <Icon name="ri:map-pin-line" class="h-4 w-4 shrink-0" />
      <span class="truncate">{memo.location.placeholder}</span>
    </a>
  )}

  {memo.reactions.length > 0 && (
    <div class="memo-reactions mt-3 flex flex-wrap gap-2">
      {memo.reactions.map(r => (
        <span class="inline-flex items-center gap-1 rounded-full bg-[var(--bg-soft)] px-2 py-1 text-sm">
          <span>{r.reactionType}</span>
          <span class="text-[var(--text-muted)]">{r.count}</span>
        </span>
      ))}
    </div>
  )}

  {memo.tags.length > 0 && (
    <div class="memo-tags mt-3 flex flex-wrap gap-2">
      {memo.tags.map(tag => (
        <a href={`/search/result?q=%23${encodeURIComponent(tag)}`} class="text-sm text-[var(--link)] hover:underline">#{tag}</a>
      ))}
    </div>
  )}

  <footer class="memo-footer mt-4 flex items-center gap-4 text-sm text-[var(--text-muted)]">
    <a href={publicUrl} target="_blank" rel="noopener noreferrer" class="hover:text-[var(--link)]">
      前往 Memos 原文 →
    </a>
  </footer>
</article>

{images.slice(0, 4).map((img, idx) => (
  <div popover id={`lightbox-${memo.shortId}-${idx}`} class="memo-lightbox fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
    <button type="button" popovertarget={`lightbox-${memo.shortId}-${idx}`} popovertargetaction="hide" class="absolute right-4 top-4 text-white">
      <Icon name="ri:close-line" class="h-8 w-8" />
    </button>
    <img src={img.externalLink} alt={img.filename} class="max-h-full max-w-full object-contain" />
  </div>
))}
```

注意：需要确认 `formatRelativeTime` 已存在于 `src/lib/post-ui.ts` 或创建它。

---

## Task 20: 更新 post-ui.ts

**Files:**

- Modify: `src/lib/post-ui.ts`

- [ ] **Step 1: 添加时间格式化函数**

```ts
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
```

---

## Task 21: 创建 MemosPage.astro

**Files:**

- Create: `src/components/MemosPage.astro`

- [ ] **Step 1: 写入列表组件**

```astro
---
import type { Memo } from '../types.ts'
import MemoEntry from './MemoEntry.astro'

interface Props {
  memos: Memo[]
  instanceUrl: string
  nextPageToken?: string
  title?: string
}

const { memos, instanceUrl, nextPageToken, title } = Astro.props
---

<div class="memos-page">
  {title && <h1 class="mb-6 text-2xl font-bold text-[var(--text)]">{title}</h1>}
  <div class="memos-list space-y-8">
    {memos.map(memo => (
      <MemoEntry memo={memo} instanceUrl={instanceUrl} />
    ))}
  </div>

  <nav class="memo-pagination mt-10 flex justify-between">
    {nextPageToken ? (
      <a href={`/before/${nextPageToken}`} class="rounded-lg bg-[var(--bg-soft)] px-4 py-2 text-[var(--text)] hover:bg-[var(--bg-mute)]">
        下一页 →
      </a>
    ) : (
      <span class="text-[var(--text-muted)]">已经到底了</span>
    )}
  </nav>
</div>
```

---

## Task 22: 更新 SiteHeader.astro

**Files:**

- Modify: `src/components/SiteHeader.astro`

- [ ] **Step 1: 使用新的 SiteInfo 类型**

```astro
---
import type { SiteInfo } from '../lib/memos/instance.ts'

interface Props {
  site: SiteInfo
}

const { site } = Astro.props
---

<header class="site-header">
  <div class="site-header-inner flex items-center gap-4">
    {site.avatar && (
      <img src={site.avatar} alt={site.title} class="h-16 w-16 rounded-full object-cover" loading="lazy" />
    )}
    <div>
      <h1 class="text-xl font-bold text-[var(--text)]">{site.title}</h1>
      {site.description && <p class="text-sm text-[var(--text-muted)]">{site.description}</p>}
    </div>
  </div>
</header>
```

---

## Task 23: 更新 SiteNavigation.astro

**Files:**

- Modify: `src/components/SiteNavigation.astro`

- [ ] **Step 1: 移除 Telegram 相关入口，保留搜索/标签/友链/Feed**

保留 `/`、`/tags`、`/links`、`/rss.xml`、搜索框。移除 `TELEGRAM` 等社交链接（或移至 `social.ts` 处理）。

---

## Task 24: 更新首页 index.astro

**Files:**

- Modify: `src/pages/index.astro`

- [ ] **Step 1: 使用 Memos 数据**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import SiteHeader from '../components/SiteHeader.astro'
import SiteNavigation from '../components/SiteNavigation.astro'
import MemosPage from '../components/MemosPage.astro'
import SiteFooter from '../components/SiteFooter.astro'
import { getMemosInfo } from '../lib/memos/index.ts'
import { getSiteInfo } from '../lib/memos/instance.ts'

const info = await getMemosInfo()
const site = await getSiteInfo()
---

<BaseLayout title={site.title} description={site.description}>
  <SiteHeader site={site} />
  <SiteNavigation />
  <main class="mx-auto max-w-[680px] px-4 py-8">
    <MemosPage memos={info.memos} instanceUrl={info.instanceUrl} nextPageToken={info.nextPageToken} />
  </main>
  <SiteFooter />
</BaseLayout>
```

---

## Task 25: 更新分页页 before/[cursor].astro

**Files:**

- Modify: `src/pages/before/[cursor].astro`

- [ ] **Step 1: 改用 Memos pageToken**

```astro
---
export const prerender = false

import BaseLayout from '../../layouts/BaseLayout.astro'
import SiteHeader from '../../components/SiteHeader.astro'
import SiteNavigation from '../../components/SiteNavigation.astro'
import MemosPage from '../../components/MemosPage.astro'
import SiteFooter from '../../components/SiteFooter.astro'
import { getMemosInfo } from '../../lib/memos/index.ts'
import { getSiteInfo } from '../../lib/memos/instance.ts'

const { cursor } = Astro.params
const info = await getMemosInfo({ pageToken: cursor })
const site = await getSiteInfo()
---

<BaseLayout title={`更早的 memo - ${site.title}`}>
  <SiteHeader site={site} />
  <SiteNavigation />
  <main class="mx-auto max-w-[680px] px-4 py-8">
    <MemosPage memos={info.memos} instanceUrl={info.instanceUrl} nextPageToken={info.nextPageToken} />
  </main>
  <SiteFooter />
</BaseLayout>
```

---

## Task 26: 删除 after/[cursor].astro

**Files:**

- Delete: `src/pages/after/[cursor].astro`

- [ ] **Step 1: 删除文件**

Run:

```bash
Remove-Item -Path "src/pages/after/[cursor].astro"
```

---

## Task 27: 更新详情页 posts/[id].astro

**Files:**

- Modify: `src/pages/posts/[id].astro`

- [ ] **Step 1: 改用 Memos 数据并加载评论**

```astro
---
export const prerender = false

import BaseLayout from '../../layouts/BaseLayout.astro'
import SiteHeader from '../../components/SiteHeader.astro'
import SiteNavigation from '../../components/SiteNavigation.astro'
import MemoEntry from '../../components/MemoEntry.astro'
import CreatorAvatar from '../../components/CreatorAvatar.astro'
import SiteFooter from '../../components/SiteFooter.astro'
import { getMemoById, getMemoPublicUrl } from '../../lib/memos/index.ts'
import { getSiteInfo } from '../../lib/memos/instance.ts'
import { renderMarkdown } from '../../lib/memos/markdown.ts'
import { formatRelativeTime } from '../../lib/post-ui.ts'

const { id } = Astro.params
if (!id) {
  return Astro.redirect('/', 302)
}

const { memo, comments } = await getMemoById(`memos/${id}`)
const site = await getSiteInfo()
const publicUrl = getMemoPublicUrl(site.instanceUrl, memo.shortId)
---

<BaseLayout title={`${memo.snippet.slice(0, 40)} - ${site.title}`} description={memo.snippet}>
  <SiteHeader site={site} />
  <SiteNavigation />
  <main class="mx-auto max-w-[680px] px-4 py-8">
    <MemoEntry memo={memo} instanceUrl={site.instanceUrl} showComments={true} />

    <section class="memo-comments mt-10">
      <h2 class="mb-4 text-lg font-bold text-[var(--text)]">评论</h2>
      {comments.length === 0 ? (
        <p class="text-[var(--text-muted)]">暂无评论</p>
      ) : (
        <div class="space-y-4">
          {comments.map(comment => (
            <div class="comment-item flex gap-3 rounded-lg bg-[var(--bg-soft)] p-4">
              <CreatorAvatar creator={comment.creator} />
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-[var(--text)]">{comment.creator.displayName || comment.creator.username}</span>
                  <time class="text-xs text-[var(--text-muted)]" datetime={comment.createTime}>{formatRelativeTime(comment.createTime)}</time>
                </div>
                <div class="comment-content mt-1 text-sm text-[var(--text)]" set:html={renderMarkdown(comment.content)} />
              </div>
            </div>
          ))}
        </div>
      )}
      <a href={publicUrl} target="_blank" rel="noopener noreferrer" class="mt-6 inline-block text-sm text-[var(--link)] hover:underline">
        前往 Memos 原文评论 / 点赞 →
      </a>
    </section>
  </main>
  <SiteFooter />
</BaseLayout>
```

---

## Task 28: 更新搜索页 search/result.astro

**Files:**

- Modify: `src/pages/search/result.astro`

- [ ] **Step 1: 改用 Memos 搜索**

```astro
---
export const prerender = false

import BaseLayout from '../../layouts/BaseLayout.astro'
import SiteHeader from '../../components/SiteHeader.astro'
import SiteNavigation from '../../components/SiteNavigation.astro'
import MemosPage from '../../components/MemosPage.astro'
import SiteFooter from '../../components/SiteFooter.astro'
import { getMemosInfo } from '../../lib/memos/index.ts'
import { getSiteInfo } from '../../lib/memos/instance.ts'

const q = Astro.url.searchParams.get('q') || ''
const info = q ? await getMemosInfo({ q }) : await getMemosInfo()
const site = await getSiteInfo()
---

<BaseLayout title={`搜索: ${q} - ${site.title}`}>
  <SiteHeader site={site} />
  <SiteNavigation />
  <main class="mx-auto max-w-[680px] px-4 py-8">
    <MemosPage memos={info.memos} instanceUrl={info.instanceUrl} nextPageToken={info.nextPageToken} title={q ? `搜索: ${q}` : undefined} />
  </main>
  <SiteFooter />
</BaseLayout>
```

---

## Task 29: 更新标签页 tags.astro

**Files:**

- Modify: `src/pages/tags.astro`

- [ ] **Step 1: 从 Memos 数据聚合标签**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import SiteHeader from '../components/SiteHeader.astro'
import SiteNavigation from '../components/SiteNavigation.astro'
import SiteFooter from '../components/SiteFooter.astro'
import { getMemosInfo } from '../lib/memos/index.ts'
import { getSiteInfo } from '../lib/memos/instance.ts'

const info = await getMemosInfo({ pageSize: 1000 })
const tagCounts = info.memos.reduce((map, memo) => {
  for (const tag of memo.tags) {
    map.set(tag, (map.get(tag) || 0) + 1)
  }
  return map
}, new Map<string, number>())
const tags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1])
const site = await getSiteInfo()
---

<BaseLayout title={`标签 - ${site.title}`}>
  <SiteHeader site={site} />
  <SiteNavigation />
  <main class="mx-auto max-w-[680px] px-4 py-8">
    <h1 class="mb-6 text-2xl font-bold text-[var(--text)]">标签</h1>
    <div class="flex flex-wrap gap-3">
      {tags.map(([tag, count]) => (
        <a href={`/search/result?q=%23${encodeURIComponent(tag)}`} class="rounded-full bg-[var(--bg-soft)] px-4 py-2 text-[var(--text)] hover:bg-[var(--bg-mute)]">
          #{tag} <span class="text-[var(--text-muted)]">({count})</span>
        </a>
      ))}
    </div>
  </main>
  <SiteFooter />
</BaseLayout>
```

---

## Task 30: 更新友链页 links.astro

**Files:**

- Modify: `src/pages/links.astro`

- [ ] **Step 1: 接入友链 API**

```astro
---
export const prerender = false

import BaseLayout from '../layouts/BaseLayout.astro'
import SiteHeader from '../components/SiteHeader.astro'
import SiteNavigation from '../components/SiteNavigation.astro'
import SiteFooter from '../components/SiteFooter.astro'
import { getSiteInfo } from '../lib/memos/instance.ts'
import { getFriendLinkApiUrl, getFriendLinkApplyUrl } from '../lib/env.ts'
import type { FriendLinkResponse } from '../types.ts'
import { ofetch } from 'ofetch'

const apiUrl = getFriendLinkApiUrl().replace(/\/$/, '')
const response = await ofetch<FriendLinkResponse>(`${apiUrl}/api/public/friend/?page=1&page_size=100&status=survival`, {
  headers: { Accept: 'application/json' },
  retry: 2,
  timeout: 10000,
})
const friends = response.data?.items || []
const site = await getSiteInfo()
const applyUrl = getFriendLinkApplyUrl()
---

<BaseLayout title={`友链 - ${site.title}`}>
  <SiteHeader site={site} />
  <SiteNavigation />
  <main class="mx-auto max-w-[680px] px-4 py-8">
    <h1 class="mb-6 text-2xl font-bold text-[var(--text)]">友情链接</h1>
    <div class="friend-links grid gap-4 sm:grid-cols-2">
      {friends.map(friend => (
        <a href={friend.link} target="_blank" rel="noopener noreferrer" class="friend-link-card flex items-center gap-3 rounded-lg border border-[var(--border)] p-4 hover:bg-[var(--bg-soft)]">
          {friend.avatar && <img src={friend.avatar} alt={friend.name} class="h-12 w-12 rounded-full object-cover" loading="lazy" />}
          <div class="min-w-0 flex-1">
            <div class="font-medium text-[var(--text)]">{friend.name}</div>
            {friend.description && <div class="truncate text-sm text-[var(--text-muted)]">{friend.description}</div>}
          </div>
        </a>
      ))}
    </div>
    {applyUrl && (
      <div class="mt-8">
        <a href={applyUrl} target="_blank" rel="noopener noreferrer" class="text-[var(--link)] hover:underline">申请友链 →</a>
      </div>
    )}
  </main>
  <SiteFooter />
</BaseLayout>
```

---

## Task 31: 更新 RSS / JSON Feed

**Files:**

- Modify: `src/pages/rss.xml.ts`
- Modify: `src/pages/rss.json.ts`

- [ ] **Step 1: 改用 Memos 数据**

```ts
// rss.xml.ts
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getMemosInfo } from "../lib/memos/index.ts";
import { getSiteInfo } from "../lib/memos/instance.ts";
import { buildFeedMemos } from "../lib/feed.ts";

export async function GET(context: APIContext) {
  const info = await getMemosInfo({ pageSize: 50 });
  const site = await getSiteInfo();
  const items = buildFeedMemos(info);
  return rss({
    title: site.title,
    description: site.description,
    site: context.site?.toString() || site.instanceUrl,
    items: items.map((item) => ({
      title: item.title,
      pubDate: item.pubDate,
      description: item.snippet,
      link: item.link,
      content: item.content,
    })),
  });
}
```

```ts
// rss.json.ts
import type { APIContext } from "astro";
import { getMemosInfo } from "../lib/memos/index.ts";
import { getSiteInfo } from "../lib/memos/instance.ts";
import { buildFeedMemos } from "../lib/feed.ts";

export async function GET(context: APIContext) {
  const info = await getMemosInfo({ pageSize: 50 });
  const site = await getSiteInfo();
  const items = buildFeedMemos(info);
  return new Response(
    JSON.stringify({
      version: "https://jsonfeed.org/version/1.1",
      title: site.title,
      description: site.description,
      home_page_url: context.site?.toString() || site.instanceUrl,
      feed_url: `${context.site?.toString() || site.instanceUrl}/rss.json`,
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        content_html: item.content,
        summary: item.snippet,
        url: item.link,
        date_published: item.pubDate.toISOString(),
      })),
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
}
```

---

## Task 32: 更新 Sitemap

**Files:**

- Modify: `src/pages/sitemap.xml.ts`
- Modify: `src/pages/sitemap/[cursor].xml.ts`

- [ ] **Step 1: 改用 Memos 数据**

```ts
// sitemap.xml.ts
import type { APIContext } from "astro";
import { getMemosInfo } from "../lib/memos/index.ts";

export async function GET(context: APIContext) {
  const info = await getMemosInfo({ pageSize: 1000 });
  const baseUrl = context.site?.toString() || "https://example.com";
  const urls = info.memos
    .map(
      (m) =>
        `<url><loc>${baseUrl}/posts/${m.shortId}</loc><lastmod>${m.updateTime}</lastmod></url>`,
    )
    .join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    {
      headers: { "Content-Type": "application/xml" },
    },
  );
}
```

`sitemap/[cursor].xml.ts` 可删除或同样使用 Memos 数据。

---

## Task 33: 更新 site.webmanifest.ts

**Files:**

- Modify: `src/pages/site.webmanifest.ts`

- [ ] **Step 1: 使用 SiteInfo**

```ts
import type { APIContext } from "astro";
import { getSiteInfo } from "../lib/memos/instance.ts";

export async function GET(context: APIContext) {
  const site = await getSiteInfo();
  const baseUrl = context.site?.toString() || site.instanceUrl;
  return new Response(
    JSON.stringify({
      name: site.title,
      short_name: site.title,
      start_url: baseUrl,
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#ffffff",
      icons: site.avatar
        ? [{ src: site.avatar, sizes: "192x192", type: "image/png" }]
        : [],
    }),
    {
      headers: { "Content-Type": "application/manifest+json" },
    },
  );
}
```

---

## Task 34: 删除 Telegram 相关文件

**Files:**

- Delete: `src/lib/telegram/` 目录
- Delete: `src/lib/static-proxy.ts`
- Delete: `src/pages/static/[...url].ts`
- Delete: `src/pages/after/[cursor].astro`
- Delete: `src/components/ChannelAvatar.astro`
- Delete: `src/components/PostEntry.astro`
- Delete: `src/components/PostsPage.astro`

- [ ] **Step 1: 删除文件和目录**

Run:

```bash
Remove-Item -Recurse -Force "src/lib/telegram"
Remove-Item "src/lib/static-proxy.ts"
Remove-Item "src/pages/static/[...url].ts"
Remove-Item "src/pages/after/[cursor].astro"
Remove-Item "src/components/ChannelAvatar.astro"
Remove-Item "src/components/PostEntry.astro"
Remove-Item "src/components/PostsPage.astro"
```

---

## Task 35: 更新 .env.example

**Files:**

- Modify: `.env.example`

- [ ] **Step 1: 替换为新的环境变量示例**

```bash
# Memos 数据源（必填）
MEMOS_API_URL=https://mm.2005815.xyz/api/v1

# 只展示特定用户的公开 memo（可选，半角逗号分隔）
MEMOS_CREATORS=kemiao

# 每页数量（可选，默认 20）
MEMOS_PAGE_SIZE=20

# 站点信息覆盖（可选）
MEMOS_TITLE=我的朋友圈
MEMOS_DESCRIPTION=
MEMOS_AVATAR=

# 友链 API（可选）
FRIEND_LINK_API_URL=https://blog-api.2005815.xyz/
FRIEND_LINK_APPLY_URL=https://blog-api.2005815.xyz/friend-apply
```

---

## Task 36: 样式补充

**Files:**

- Modify: `src/styles/app/feed.css`

- [ ] **Step 1: 添加 memo 条目样式**

```css
.memo-entry {
  padding: 1rem 0;
  border-bottom: 1px solid var(--border);
}

.memo-entry:last-child {
  border-bottom: none;
}

.memo-content p {
  margin-bottom: 0.75rem;
}

.memo-content a {
  color: var(--link);
}

.memo-content a.memo-tag {
  color: var(--link);
  text-decoration: none;
}

.memo-content pre {
  overflow-x: auto;
  padding: 1rem;
  border-radius: 0.5rem;
  background: var(--bg-soft);
}

.memo-image-button {
  cursor: zoom-in;
}

.memo-lightbox {
  border: none;
  background: rgba(0, 0, 0, 0.9);
}

.memo-lightbox:popover-open {
  display: flex;
}
```

---

## Task 37: 验证与修复

**Files:**

- All modified files

- [ ] **Step 1: 类型检查**

Run:

```bash
pnpm typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 2: 代码检查**

Run:

```bash
pnpm lint
```

Expected: no ESLint errors.

- [ ] **Step 3: 构建**

Run:

```bash
pnpm build
```

Expected: build succeeds.

- [ ] **Step 4: 开发服务器 smoke test**

Run:

```bash
$env:MEMOS_API_URL='https://mm.2005815.xyz/api/v1'; pnpm dev
```

Expected: dev server starts on `http://localhost:4321`.

---

## 自检

| 需求                    | 对应任务            |
| ----------------------- | ------------------- |
| Memos 数据源            | Task 5-10, 24-28    |
| Memos 原生评论（只读）  | Task 10, 27         |
| Memos reactions（只读） | Task 9, 19          |
| Markdown 富文本         | Task 7, 19, 36      |
| pinned 置顶             | Task 9, 19          |
| tags 字段               | Task 9, 19, 29      |
| attachments 渲染        | Task 8, 19          |
| 灯箱                    | Task 19             |
| 位置卡片                | Task 8, 19          |
| 搜索                    | Task 5, 28          |
| 友链接口                | Task 30             |
| 明暗模式                | Task 15-17          |
| 多端布局                | Task 19, 29, 30, 36 |

已确认无 TBD/TODO，类型签名跨任务一致。
