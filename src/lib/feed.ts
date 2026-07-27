import type { Memo, MemoInfo } from '../types.ts'
import { getMemoPublicUrl } from './memos/render.ts'

export interface FeedMemo {
  id: string
  title: string
  link: string
  pubDate: Date
  content: string
  snippet: string
}

export function buildFeedMemos(info: MemoInfo): FeedMemo[] {
  return info.memos.map((memo: Memo) => {
    const title = memo.property.title || memo.snippet.slice(0, 60) || `Memo ${memo.shortId}`
    return {
      id: memo.id,
      title,
      link: getMemoPublicUrl(info.instanceUrl, memo.shortId),
      pubDate: new Date(memo.createTime),
      content: memo.html,
      snippet: memo.snippet,
    }
  })
}
