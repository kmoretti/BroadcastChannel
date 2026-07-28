# 广播频道

**将你的 Memos 实例转为微博客。**

---

[English](./README.md) | 简体中文

**目录：** [特性](#-特性) · [演示](#-演示) · [技术栈](#-技术栈) · [部署](#deployment) · [配置](#configuration) · [主题](#-主题) · [常问问题](#-常问问题) · [赞助](#-赞助)

## ✨ 特性

- **将 Memos 实例转为微博客**
- **SEO 友好** `/sitemap.xml`
- **浏览器端 0 JS**
- **提供 RSS 和 RSS JSON** `/rss.xml` `/rss.json`

## 🪧 演示

### 真实用户

- [面条实验室](https://memo.miantiao.me/)
- [Find Blog👁发现博客](https://broadcastchannel.pages.dev/)
- [Memos 广场 🎪](https://now.memobbs.app/)
- [APPDO 数字生活指南](https://mini.appdo.xyz/)
- [85.60×53.98卡粉订阅/提醒](https://tg.docofcard.com/)
- [新闻在花频道](https://tg.istore.app/)
- [ALL About RSS](https://blog.rss.tips/)
- [Charles Chin's Whisper](https://memo.eallion.com/)
- [PlayStation 新闻转发](https://playstationnews.pages.dev)
- [Yu's Life](https://daily.pseudoyu.com/)
- [Leslie 和朋友们](https://tg.imlg.co/)
- [OKHK 分享](https://tg.okhk.net/)
- [gledos 的微型博客](https://microblogging.gledos.science)
- [Steve Studio](https://tgc.surgeee.me/)
- [LiFePO4:沙雕吐槽](https://lifepo4.top)
- [Hotspot Hourly](https://hourly.top/)
- [大河马中文财经新闻分享](https://a.xiaomi318.com/)
- [\_My. Tricks 🎩 Collection](https://channel.mykeyvans.com)
- [小报童专栏精选](https://xiaobaotong.genaiprism.site/)
- [Fake news](https://fake-news.csgo.ovh/)
- [miyi23's Geekhub资源分享](https://gh.miyi23.top/)
- [Magazine｜期刊杂志｜财新周刊](https://themagazine.top)
- [Remote Jobs & Cooperation](https://share-remote-jobs.vercel.app/)
- [甬哥侃侃侃--频道发布](https://ygkkktg.pages.dev)
- [Fugoou.log](https://fugoou.xyz)
- [Bboysoul的博客](https://tg.bboy.app/)
- [MakerHunter](https://share.makerhunter.com/)
- [ChatGPT/AI新闻聚合](https://g4f.icu/)
- [Abner's memos](https://memos.abnerz6.top/)
- [小众软件的发现](https://talk.appinn.net/)
- [小报童优惠与排行榜](https://youhui.xiaobaoto.com/)
- [热干面拌 10 号土豆泥](https://memo.moran.im/)
- [万事屋工程部](https://t.wanshiwu.fyi/)

### 平台

1. [Cloudflare Workers](https://broadcast-channel.run-on.workers.dev/)
2. [Netlify](https://broadcast-channel.netlify.app/)
3. [Vercel](https://broadcast-channel.vercel.app/)

广播频道支持部署在 Cloudflare Workers、Netlify、Vercel 等支持 SSR 的无服务器平台或者 VPS。
Cloudflare Pages SSR 在当前 Astro 6 + @astrojs/cloudflare v13 下不受支持，Cloudflare 部署请使用 Workers。
具体教程见[部署你的 Astro 站点](https://docs.astro.build/zh-cn/guides/deploy/)。

## 🧱 技术栈

- 框架：[Astro](https://astro.build/)
- 内容管理系统：[Memos](https://usememos.com)
- 主题灵感与 CSS 兼容来源：[Bear Blog](https://github.com/HermanMartinus/bearblog)（独立实现，与 Bear 无官方关系，未包含其源文件）
- 可选主题：[Sepia](https://github.com/Planetable/SiteTemplateSepia)
- 可选主题灵感：[Terminal](https://github.com/panr/hugo-theme-terminal)
- 可选主题灵感：[Aria](https://github.com/miantiao-me/astro-aria)
- 可选主题视觉灵感：[Hacker News](https://news.ycombinator.com/)（由 Y Combinator 运营，独立实现，与其无官方关系）
- 可选主题视觉灵感：[Zed 的 Agentic Engineering 页面](https://zed.dev/agentic-engineering)（独立实现，与 Zed Industries, Inc. 无官方关系）

## 🏗️ 部署

<a id="deployment"></a>

### Docker

1. `docker pull ghcr.io/miantiao-me/broadcastchannel:main`
2. `docker run -d --name broadcastchannel -p 4321:4321 -e MEMOS_API_URL=https://mm.2005815.xyz/api/v1 ghcr.io/miantiao-me/broadcastchannel:main`

### Serverless

1. [Fork](https://github.com/miantiao-me/BroadcastChannel/fork) 此项目到你 GitHub
2. 在 Cloudflare Workers/Netlify/Vercel/EdgeOne 创建项目
3. 选择 `BroadcastChannel` 项目和 `Astro` 框架
4. 配置环境变量 `MEMOS_API_URL` 为你的 Memos API 地址。此为最小化配置，更多见 [配置](#configuration)
5. 保存并部署
6. 绑定域名（可选）
7. 更新代码，参考 GitHub 官方文档 [从 Web UI 同步分叉分支](https://docs.github.com/zh/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork#syncing-a-fork-branch-from-the-web-ui)

项目支持 EdgeOne，并会通过 std-env 的 `edgeone_pages` provider 或平台提供的 `EDGEONE_PROJECT_ID`/`EO_MAKERS` 变量自动检测。仅在需要覆盖自动适配器检测时设置 `SERVER_ADAPTER`。

Cloudflare Workers 最小命令：

```bash
pnpm exec wrangler login
SERVER_ADAPTER=cloudflare_workers pnpm build
pnpm exec wrangler deploy
```

请在 Workers 控制台配置 `MEMOS_API_URL` 等运行时变量，或使用 `pnpm exec wrangler secret put MEMOS_API_URL`。
Cloudflare Pages SSR 在 Astro 6 + @astrojs/cloudflare v13 下不受支持，请将 Pages 部署迁移到 Workers。

## ⚒️ 配置

<a id="configuration"></a>

### 最小配置

只需配置 `MEMOS_API_URL`：你的 Memos API 地址。

```env
MEMOS_API_URL=https://mm.2005815.xyz/api/v1
```

### 完整参考

可选变量。亦可对照 [`.env.example`](./.env.example)。

```env
## 必填
MEMOS_API_URL=https://mm.2005815.xyz/api/v1

## 只展示指定创作者的公开 memo（半角逗号分隔）
MEMOS_CREATORS=kemiao

## 每页数量（默认 20）
MEMOS_PAGE_SIZE=20

## 站点信息覆盖
MEMOS_TITLE=我的朋友圈
MEMOS_DESCRIPTION=
MEMOS_AVATAR=

## 站点文字 Logo（可选，例如 <mt/>；不填则使用头像）
MEMOS_LOGO=

## 创作者信息覆盖（可选，会覆盖每条 memo 的作者头像和昵称）
MEMOS_CREATOR_NAME=
MEMOS_CREATOR_AVATAR=

## 语言（BCP 47 locale，例如 zh-CN 或 en）
LOCALE=zh-CN

## 社交媒体用户名
TWITTER=miantiao-me

## 可信管理员原始 HTML 注入（页头 / 页脚）
HEADER_INJECT=
FOOTER_INJECT=

## 友链
FRIEND_LINK_API_URL=https://blog-api.2005815.xyz/
FRIEND_LINK_APPLY_URL=https://blog-api.2005815.xyz/friend-apply

## 页头社会化链接（可选）
SOCIAL_RSS_URL=/rss.xml
SOCIAL_X_URL=https://x.com/miantiao_me
SOCIAL_GITHUB_URL=https://github.com/miantiao-me
SOCIAL_TELEGRAM_URL=https://t.me/miantiao_chat
SOCIAL_QQ_URL=https://qm.qq.com/q/xxxxxx
SOCIAL_EMAIL_URL=mailto:hello@example.com
SOCIAL_BILIBILI_URL=https://space.bilibili.com/xxxxxx

## 高级（一般无需修改）
# 需要时覆盖自动适配器检测。
SERVER_ADAPTER=
```

站点介绍文案可编辑 `src/content/site-intro.md`，支持 Markdown 链接。

## 🎨 主题

始终加载完整 Base 主题。不配置 `HEADER_INJECT` 即使用 Base；也可以且只能加载 **一个** 内置覆盖主题：

| 主题             | 路径                           |
| ---------------- | ------------------------------ |
| Sepia            | `/themes/sepia.css`            |
| Aria             | `/themes/aria.css`             |
| Terminal Amber   | `/themes/terminal-amber.css`   |
| Terminal Green   | `/themes/terminal-green.css`   |
| Terminal Cyan    | `/themes/terminal-cyan.css`    |
| Terminal Magenta | `/themes/terminal-magenta.css` |
| HN News          | `/themes/hn-news.css`          |
| ZAE              | `/themes/zae.css`              |

```env
HEADER_INJECT='<link rel="stylesheet" href="/themes/aria.css">'
```

HN News 和 ZAE 是固定浅色主题。不要直接加载 `/themes/terminal-base.css`；项目不存在 `/themes/terminal.css`。

完整配置、明暗模式、平台控制台写法、自定义 CSS 与安全边界见 **[THEMES.md](./THEMES.md)**。主题归属见 **[NOTICE.md](./NOTICE.md)**。

## 🙋🏻 常问问题

1. 为什么部署后内容为空？
   - `MEMOS_API_URL` 必须能从部署环境访问
   - Memos 实例上的对应 memo 必须是**公开**的
   - 检查 `MEMOS_CREATORS` 是否过滤掉了目标用户
   - 修改环境变量后需要**重新部署**

## ☕ 赞助

1. [在 𝕏 上关注我](https://404.li/x)
2. [在 GitHub 赞助我](https://github.com/sponsors/miantiao-me)
