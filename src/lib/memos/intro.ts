import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderMarkdown } from './markdown.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const introPath = path.resolve(__dirname, '../../content/site-intro.md')

export function getSiteIntroHtml(): string {
  let content = ''
  try {
    content = fs.readFileSync(introPath, 'utf-8')
  }
  catch {
    content = '折腾些什么玩意。\n\n群组 [@miantiao_chat](https://t.me/miantiao_chat)'
  }
  return renderMarkdown(content)
}
