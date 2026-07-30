import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderMarkdown } from './markdown.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const introPath = path.resolve(__dirname, '../../content/site-intro.md')

const defaultIntro = `欢迎来到我的个人空间~

前端基于面条的[BroadcastChannel](https://github.com/miantiao-me/BroadcastChannel)魔改自用，后端数据来自memos0.29.1版本的api，友链数据来自魔改的[blog_api](https://github.com/kmoretti/blog_api)。

前端只展示数据，评论、表情Reactions请点击 **前往 Memos 原文评论 / 点赞 →** 前往memos处进行。`

export function getSiteIntroHtml(): string {
  let content = defaultIntro
  try {
    const fileContent = fs.readFileSync(introPath, 'utf-8')
    if (fileContent.trim()) {
      content = fileContent
    }
  }
  catch {
    // 在 Vercel 等无文件系统的环境中使用内联默认内容
  }
  return renderMarkdown(content)
}
